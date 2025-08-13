#!/usr/bin/env node
import { DataBus, STREAMS, StreamName } from '../src/index.js';
import { Command } from 'commander';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import chalk from 'chalk';
import { generateValidatedPayload, validatePayload } from './test-utils.js';

interface EventScenario {
  name: string;
  description?: string;
  events: EventDefinition[];
}

interface EventDefinition {
  stream: StreamName;
  payload?: any; // Can be literal payload or template
  generator?: string; // Use test-utils generator
  delay?: number; // Delay in ms before publishing
  repeat?: number; // Repeat this event N times
  interval?: number; // Interval between repeats
  variables?: Record<string, any>; // Variables to inject
}

interface ProducerOptions {
  file: string;
  loop?: boolean;
  loopInterval?: number;
  verbose?: boolean;
  dryRun?: boolean;
  var?: Record<string, string>;
}

class EventProducer {
  private dataBus: DataBus;
  private options: ProducerOptions;
  private globalVariables: Record<string, any> = {};

  constructor(options: ProducerOptions) {
    this.options = options;
    const config = {
      redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
      autoConnect: false,  // We'll connect manually
      exitOnStartupFailure: false
    };
    this.dataBus = new DataBus(config);
    
    // Parse global variables from CLI
    if (options.var) {
      Object.entries(options.var).forEach(([key, value]) => {
        // Try to parse as JSON, fallback to string
        try {
          this.globalVariables[key] = JSON.parse(value);
        } catch {
          this.globalVariables[key] = value;
        }
      });
    }
  }

  async start() {
    console.log(chalk.cyan.bold('🚀 Event Producer - Development Testing Tool'));
    console.log(chalk.gray(`Loading scenario from: ${this.options.file}\n`));

    try {
      // Connect to Redis
      if (!this.options.dryRun) {
        await this.dataBus.connect();
        console.log(chalk.green('✓ Connected to Redis'));
      }

      // Load scenario
      const scenario = await this.loadScenario(this.options.file);
      console.log(chalk.blue(`Loaded scenario: ${scenario.name}`));
      if (scenario.description) {
        console.log(chalk.gray(`Description: ${scenario.description}`));
      }
      console.log(chalk.gray(`Total events: ${scenario.events.length}\n`));

      // Execute scenario
      do {
        await this.executeScenario(scenario);
        
        if (this.options.loop) {
          const interval = this.options.loopInterval || 5000;
          console.log(chalk.yellow(`\n⟳ Looping in ${interval}ms...\n`));
          await this.sleep(interval);
        }
      } while (this.options.loop);

    } catch (error: any) {
      console.error(chalk.red('Fatal error:'), error.message);
      process.exit(1);
    } finally {
      if (!this.options.dryRun) {
        await this.dataBus.close();
      }
    }
  }

  private async loadScenario(filePath: string): Promise<EventScenario> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const ext = path.extname(filePath).toLowerCase();
      
      let scenario: EventScenario;
      if (ext === '.yaml' || ext === '.yml') {
        scenario = yaml.load(content) as EventScenario;
      } else if (ext === '.json') {
        scenario = JSON.parse(content);
      } else {
        throw new Error('Unsupported file format. Use .yaml, .yml, or .json');
      }

      // Validate scenario structure
      if (!scenario.name || !scenario.events || !Array.isArray(scenario.events)) {
        throw new Error('Invalid scenario format. Must have name and events array');
      }

      return scenario;
    } catch (error: any) {
      throw new Error(`Failed to load scenario: ${error.message}`);
    }
  }

  private async executeScenario(scenario: EventScenario) {
    console.log(chalk.cyan('Executing scenario...\n'));
    
    const context: Record<string, any> = {
      ...this.globalVariables,
      timestamp: Date.now().toString(),  // String for compatibility with Solana event schemas
      timestampNum: Date.now(),          // Number version if needed
      scenarioId: `scenario_${Date.now()}`
    };

    for (let i = 0; i < scenario.events.length; i++) {
      const event = scenario.events[i];
      console.log(chalk.yellow(`[${i + 1}/${scenario.events.length}] Publishing to ${event.stream}`));
      
      try {
        await this.executeEvent(event, context);
      } catch (error: any) {
        console.error(chalk.red(`  ✗ Failed: ${error.message}`));
        if (!this.options.dryRun) {
          throw error; // Stop on error unless dry run
        }
      }
    }
    
    console.log(chalk.green('\n✓ Scenario completed'));
  }

  private async executeEvent(event: EventDefinition, context: Record<string, any>) {
    // Handle delay
    if (event.delay) {
      console.log(chalk.gray(`  ⏱ Waiting ${event.delay}ms...`));
      await this.sleep(event.delay);
    }

    // Merge event variables into context
    const eventContext = { ...context, ...event.variables };
    
    // Determine repeat count
    const repeatCount = event.repeat || 1;
    const interval = event.interval || 0;

    for (let i = 0; i < repeatCount; i++) {
      // Add index and fresh timestamp to context for this iteration
      const iterationContext = { 
        ...eventContext, 
        index: i + 1,
        timestamp: Date.now().toString(),  // Fresh string timestamp for each event
        timestampNum: Date.now()           // Number version if needed
      };
      
      let payload: any;
      
      // Generate or use provided payload
      if (event.generator) {
        // Use fixture generator
        payload = generateValidatedPayload(event.stream);
        console.log(chalk.gray(`  → Generated payload using fixture`));
      } else if (event.payload) {
        // Use provided payload with variable substitution
        payload = this.substituteVariables(event.payload, iterationContext);
        // Validate the payload
        payload = validatePayload(event.stream, payload);
      } else {
        throw new Error('Event must have either payload or generator');
      }

      if (this.options.verbose) {
        console.log(chalk.gray('  Payload:'), JSON.stringify(payload, null, 2));
      }

      // Publish or dry run
      if (this.options.dryRun) {
        console.log(chalk.blue(`  [DRY RUN] Would publish to ${event.stream}`));
      } else {
        const messageId = await this.dataBus.publish(event.stream, payload);
        console.log(chalk.green(`  ✓ Published: ${messageId}`));
        
        // Store generated IDs in context for reference
        if (payload.orderId) iterationContext.lastOrderId = payload.orderId;
        if (payload.positionId) iterationContext.lastPositionId = payload.positionId;
        if (payload.basketId) iterationContext.lastBasketId = payload.basketId;
      }

      // Wait between repeats
      if (i < repeatCount - 1 && interval > 0) {
        await this.sleep(interval);
      }
    }
  }

  private substituteVariables(obj: any, context: Record<string, any>): any {
    if (typeof obj === 'string') {
      // Check if the entire string is a variable reference
      const match = obj.match(/^\{\{(\w+)\}\}$/);
      if (match) {
        // Return the actual value (preserving type) if it's a complete variable reference
        return context[match[1]] !== undefined ? context[match[1]] : obj;
      }
      
      // Otherwise, do string replacement
      return obj.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return context[key] !== undefined ? String(context[key]) : match;
      });
    } else if (Array.isArray(obj)) {
      return obj.map(item => this.substituteVariables(item, context));
    } else if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.substituteVariables(value, context);
      }
      return result;
    }
    return obj;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI setup
const program = new Command();

program
  .name('event-producer')
  .description('Produce events from scenario files for development testing')
  .version('1.0.0')
  .requiredOption('-f, --file <path>', 'Path to scenario file (YAML or JSON)')
  .option('-l, --loop', 'Loop the scenario continuously')
  .option('-i, --loop-interval <ms>', 'Interval between loops in milliseconds', '5000')
  .option('-v, --verbose', 'Verbose output with payload details')
  .option('-d, --dry-run', 'Dry run mode - validate but don\'t publish')
  .option('--var <key=value>', 'Set variable (can be used multiple times)', (val, memo) => {
    const [key, value] = val.split('=');
    memo[key] = value;
    return memo;
  }, {})
  .action(async (options) => {
    const producer = new EventProducer(options);
    await producer.start();
  });

// ESM equivalent of if (require.main === module)
if (import.meta.url === `file://${process.argv[1]}`) {
  program.parse();
}

export { EventProducer, EventScenario };