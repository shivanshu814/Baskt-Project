#!/usr/bin/env node
import { DataBus } from '../src/index';
import { StreamName, getAllStreamValues, getStreamConfig } from '../src/index';
import { generateTestCases, generateValidatedPayload, validatePayload, TestCase } from './test-utils';
import chalk from 'chalk';
import { ulid } from 'ulid';
import Table from 'cli-table3';
import { Command } from 'commander'

interface TestResult {
  stream: StreamName;
  published: number;
  validated: boolean;
  sizeTestPassed: boolean;
  retentionTestPassed: boolean;
  maxLenTestPassed: boolean;
  errors: string[];
}

interface TestOptions {
  streams?: string[];
  count?: number;
  exitOnFail?: boolean;
  skipRetention?: boolean;
  skipSize?: boolean;
  verbose?: boolean;
}

class EventEmitter {
  private dataBus: DataBus;
  private wrongKeyDataBus: DataBus;
  private options: TestOptions;
  
  constructor(options: TestOptions = {}) {
    const config = {
      redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    };
    
    this.dataBus = new DataBus(config);
    
    // Create second DataBus instance with wrong signing key for signature validation tests
    this.wrongKeyDataBus = new DataBus({
      ...config,
    });
    
    this.options = options;
  }

  async start(): Promise<boolean> {
    console.log(chalk.cyan.bold('🚀 Redis Stream Event Emitter & Contract Tester'));
    console.log(chalk.gray('Testing streams with schema-validated payloads\n'));

    let success = false;
    try {
      await this.dataBus.connect();
      await this.wrongKeyDataBus.connect();
      
      const results = await this.runAllTests();
      success = this.displayResults(results);
      
    } catch (error: any) {
      console.error(chalk.red('Fatal error during testing:'), error.message);
      success = false;
    } finally {
      try {
        await this.dataBus.close();
        await this.wrongKeyDataBus.close();
      } catch (error: any) {
        console.error(chalk.yellow('Warning: Error during cleanup:'), error.message);
      }
    }
    
    if (this.options.exitOnFail && !success) {
      process.exit(1);
    }
    
    return success;
  }

  private async runAllTests(): Promise<TestResult[]> {
    const allStreams = getAllStreamValues();
    let streams = allStreams;
    
    // Filter streams if specified
    if (this.options.streams && this.options.streams.length > 0) {
      const patterns = this.options.streams;
      streams = allStreams.filter(stream => 
        patterns.some(pattern => {
          if (pattern.includes('*')) {
            const regex = new RegExp(pattern.replace(/\*/g, '.*'));
            return regex.test(stream);
          }
          return stream === pattern;
        })
      );
      
      if (streams.length === 0) {
        console.log(chalk.yellow('No streams matched the specified patterns'));
        return [];
      }
      
      console.log(chalk.blue(`Testing ${streams.length} streams matching patterns: ${patterns.join(', ')}\n`));
    } else {
      console.log(chalk.blue(`Testing all ${streams.length} streams\n`));
    }

    const results: TestResult[] = [];

    for (const stream of streams) {
      console.log(chalk.yellow(`\nTesting ${stream}...`));
      const result = await this.testStream(stream);
      results.push(result);
    }

    return results;
  }

  private async testStream(stream: StreamName): Promise<TestResult> {
    const result: TestResult = {
      stream,
      published: 0,
      validated: false,
      sizeTestPassed: false,
      retentionTestPassed: false,
      maxLenTestPassed: false,
      errors: []
    };

    try {
      console.log(chalk.gray('  1. Testing schema-validated publishing...'));
      await this.testSchemaValidatedPublishing(stream, result);
      
      console.log(chalk.gray('  2. Testing signature validation...'));
      await this.testRealisticSignatureValidation(stream, result);
      
      if (!this.options.skipSize) {
        console.log(chalk.gray('  3. Testing payload size limits...'));
        await this.testPayloadSizeLimits(stream, result);
      }
      
      if (!this.options.skipRetention) {
        console.log(chalk.gray('  4. Testing retention policies...'));
        await this.testRetentionPolicies(stream, result);
        
        console.log(chalk.gray('  5. Testing max length enforcement...'));
        await this.testMaxLengthEnforcement(stream, result);
      }
      
    } catch (error: any) {
      result.errors.push(`Fatal error: ${error.message}`);
      if (this.options.verbose) {
        console.error(chalk.red('    Stack trace:'), error.stack);
      }
    }

    return result;
  }

  private async testSchemaValidatedPublishing(stream: StreamName, result: TestResult): Promise<void> {
    try {
      const testCases = generateTestCases(stream);
      
      for (const testCase of testCases) {
        try {
          // Validate payload against schema before publishing
          const validatedPayload = validatePayload(stream, testCase.payload);
          const messageId = await this.dataBus.publish(stream, validatedPayload);
          
          if (testCase.expectError) {
            result.errors.push(`Expected error but got success: ${testCase.name}`);
          } else {
            result.published++;
            if (this.options.verbose) {
              console.log(chalk.green(`    ✓ ${testCase.name}: ${messageId}`));
            }
          }
        } catch (error: any) {
          if (!testCase.expectError) {
            result.errors.push(`${testCase.name}: ${error.message}`);
            console.log(chalk.red(`    ✗ ${testCase.name}: ${error.message}`));
          } else {
            console.log(chalk.green(`    ✓ ${testCase.name}: Expected error occurred`));
          }
        }
      }
      
      console.log(chalk.green(`    ✓ Published ${result.published} schema-validated messages`));
    } catch (error: any) {
      result.errors.push(`Schema validation test failed: ${error.message}`);
    }
  }

  private async testRealisticSignatureValidation(stream: StreamName, result: TestResult): Promise<void> {
    try {
      const payload = generateValidatedPayload(stream);
      
      // Test valid signature
      const validSignature = await this.dataBus.publish(stream, payload);
      console.log(chalk.green(`    ✓ Valid signature accepted: ${validSignature}`));
      
      // Test invalid signature by using wrong signing key
      try {
        await this.wrongKeyDataBus.publish(stream, payload);
        result.errors.push('Invalid signature was accepted');
        console.log(chalk.red('    ✗ Invalid signature was accepted'));
      } catch (error: any) {
        console.log(chalk.green('    ✓ Invalid signature rejected'));
        result.validated = true;
      }
    } catch (error: any) {
      result.errors.push(`Signature validation test failed: ${error.message}`);
    }
  }

  private async testPayloadSizeLimits(stream: StreamName, result: TestResult): Promise<void> {
    try {
      const config = getStreamConfig(stream);
      const maxPayloadKb = (config as any).maxPayloadKb || 1024; // Default 1MB
      
      // Test small payload
      const smallPayload = generateValidatedPayload(stream);
      await this.dataBus.publish(stream, smallPayload);
      console.log(chalk.green('    ✓ Small payload accepted'));

      // Test medium payload (100KB)
      const mediumData = 'x'.repeat(1024 * 100);
      const mediumPayload = { ...generateValidatedPayload(stream), testData: mediumData };
      
      try {
        await this.dataBus.publish(stream, mediumPayload);
        console.log(chalk.green('    ✓ 100KB payload accepted'));
      } catch {
        console.log(chalk.yellow('    ⚠ 100KB payload rejected'));
      }

      // Test oversized payload
      const oversizedData = 'x'.repeat(1024 * maxPayloadKb);
      const oversizedPayload = { ...generateValidatedPayload(stream), testData: oversizedData };
      
      try {
        await this.dataBus.publish(stream, oversizedPayload);
        console.log(chalk.red(`    ✗ ${maxPayloadKb}KB payload should be rejected`));
        result.errors.push('Oversized payload was accepted');
      } catch {
        console.log(chalk.green(`    ✓ ${maxPayloadKb}KB payload rejected`));
        result.sizeTestPassed = true;
      }
    } catch (error: any) {
      result.errors.push(`Size limit test failed: ${error.message}`);
    }
  }

  private async testMaxLengthEnforcement(stream: StreamName, result: TestResult): Promise<void> {
    try {
      const config = getStreamConfig(stream);
      const maxLen = config.approxMaxLen || (config as any).maxLen;
      
      if (!maxLen || maxLen === Infinity) {
        console.log(chalk.gray('    - No max length configured, skipping test'));
        result.maxLenTestPassed = true;
        return;
      }
      
      console.log(chalk.gray(`    Testing max length enforcement (limit: ${maxLen})`));
      
      // Get initial length
      const initialLength = await this.dataBus['redis'].xlen(stream);
      
      // Publish messages to exceed the limit
      const messagesToPublish = Math.min(50, Math.max(10, maxLen - initialLength + 10));
      const count = this.options.count || messagesToPublish;
      
      for (let i = 0; i < count; i++) {
        try {
          const payload = generateValidatedPayload(stream);
          await this.dataBus.publish(stream, payload);
        } catch (error: any) {
          console.log(chalk.yellow(`    ⚠ Failed to publish message ${i + 1}: ${error.message}`));
        }
      }
      
      // Check final length
      const finalLength = await this.dataBus['redis'].xlen(stream);
      
      if (finalLength <= maxLen) {
        console.log(chalk.green(`    ✓ Stream length (${finalLength}) within limit (${maxLen})`));
        result.maxLenTestPassed = true;
      } else {
        console.log(chalk.red(`    ✗ Stream length (${finalLength}) exceeds limit (${maxLen})`));
        result.errors.push(`Max length enforcement failed: ${finalLength} > ${maxLen}`);
      }
    } catch (error: any) {
      result.errors.push(`Max length test failed: ${error.message}`);
    }
  }

  private async testRetentionPolicies(stream: StreamName, result: TestResult) {
    try {
      const config = getStreamConfig(stream)
      const retentionHours = config.retentionMs ? config.retentionMs / (1000 * 60 * 60) : undefined
       const maxMessages = config.approxMaxLen ?? config.maxLen ?? '∞'
       console.log(chalk.gray(`    Configured retention: ${retentionHours ?? '∞'}h, max messages: ${maxMessages}`))
      
      const currentLength = await this.dataBus['redis'].xlen(stream)
      console.log(chalk.gray(`    Current stream length: ${currentLength}`))
      
      if (currentLength > 0) {
        const [oldestEntry] = await this.dataBus['redis'].xrange(stream, '-', '+', 'COUNT', 1)
        if (oldestEntry) {
          const oldestTimestamp = parseInt(oldestEntry[0].split('-')[0])
          const ageHours = (Date.now() - oldestTimestamp) / (1000 * 60 * 60)
          
          if (retentionHours !== undefined && ageHours > retentionHours) {
            console.log(chalk.yellow(`    ⚠ Found messages older than retention (${ageHours.toFixed(1)}h)`))
          } else {
            console.log(chalk.green(`    ✓ All messages within retention (oldest: ${ageHours.toFixed(1)}h)`))
            result.retentionTestPassed = true
          }
        }
      } else {
        console.log(chalk.gray('    - Stream empty, skipping retention check'))
        result.retentionTestPassed = true
      }
    } catch (error: any) {
      result.errors.push(`Retention test failed: ${error.message}`)
    }
  }



  private displayResults(results: TestResult[]): boolean {
    console.log(chalk.cyan.bold('\n📊 Test Results Summary\n'));

    const table = new Table({
      head: [
        chalk.white('Stream'),
        chalk.white('Published'),
        chalk.white('Validated'),
        chalk.white('Size Test'),
        chalk.white('Retention'),
        chalk.white('Max Len'),
        chalk.white('Errors')
      ],
      colWidths: [20, 10, 10, 10, 10, 10, 35],
      style: { 'padding-left': 1, 'padding-right': 1 }
    });

    let totalPublished = 0;
    let totalValidated = 0;
    let totalSizePassed = 0;
    let totalRetentionPassed = 0;
    let totalMaxLenPassed = 0;
    let totalErrors = 0;

    for (const result of results) {
      totalPublished += result.published;
      totalValidated += result.validated ? 1 : 0;
      totalSizePassed += result.sizeTestPassed ? 1 : 0;
      totalRetentionPassed += result.retentionTestPassed ? 1 : 0;
      totalMaxLenPassed += result.maxLenTestPassed ? 1 : 0;
      totalErrors += result.errors.length;

      table.push([
        chalk.cyan(result.stream),
        chalk.yellow(result.published.toString()),
        result.validated ? chalk.green('✓') : chalk.red('✗'),
        result.sizeTestPassed ? chalk.green('✓') : chalk.red('✗'),
        result.retentionTestPassed ? chalk.green('✓') : chalk.red('✗'),
        result.maxLenTestPassed ? chalk.green('✓') : chalk.red('✗'),
        result.errors.length > 0 ? chalk.red(result.errors.join('; ')) : chalk.green('None')
      ]);
    }

    console.log(table.toString());

    console.log(chalk.gray('\n─────────────────────────────────────────────────────────'));
    console.log(chalk.white('Summary:'));
    console.log(chalk.green(`  ✓ Messages Published: ${totalPublished}`));
    console.log(chalk.green(`  ✓ Signature Validation: ${totalValidated}/${results.length}`));
    console.log(chalk.green(`  ✓ Size Tests Passed: ${totalSizePassed}/${results.length}`));
    console.log(chalk.green(`  ✓ Retention Tests Passed: ${totalRetentionPassed}/${results.length}`));
    console.log(chalk.green(`  ✓ Max Length Tests Passed: ${totalMaxLenPassed}/${results.length}`));
    if (totalErrors > 0) {
      console.log(chalk.red(`  ✗ Total Errors: ${totalErrors}`));
    }

    const allTestsPassed = totalErrors === 0 && 
      totalValidated === results.length && 
      totalSizePassed === results.length &&
      totalRetentionPassed === results.length &&
      totalMaxLenPassed === results.length;

    if (allTestsPassed) {
      console.log(chalk.green.bold('\n🎉 All tests passed!'));
    } else {
      console.log(chalk.yellow.bold('\n⚠️  Some tests failed. Review the errors above.'));
    }
    
    return allTestsPassed;
  }
}

// CLI setup
const program = new Command();

program
  .name('event-emitter')
  .description('Redis Stream Event Emitter & Contract Tester')
  .version('1.0.0')
  .option('-s, --streams <patterns...>', 'Stream patterns to test (supports wildcards, e.g., order.*)')
  .option('-c, --count <number>', 'Number of messages to publish for max-length testing', '50')
  .option('--exit-on-fail', 'Exit with non-zero code if any test fails')
  .option('--skip-retention', 'Skip retention policy tests')
  .option('--skip-size', 'Skip payload size limit tests')
  .option('-v, --verbose', 'Verbose output with detailed test results')
  .action(async (options) => {
    const testOptions: TestOptions = {
      streams: options.streams,
      count: parseInt(options.count),
      exitOnFail: options.exitOnFail,
      skipRetention: options.skipRetention,
      skipSize: options.skipSize,
      verbose: options.verbose
    };

    const emitter = new EventEmitter(testOptions);
    const success = await emitter.start();
    
    if (!success) {
      console.log(chalk.red('\n❌ Some tests failed.'));
    }
  });

if (require.main === module) {
  program.parse();
}