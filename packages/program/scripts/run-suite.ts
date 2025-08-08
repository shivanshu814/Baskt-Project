import { spawn, execSync, ChildProcess } from 'node:child_process';
import { readdirSync, statSync, rmSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import getPort, { portNumbers } from 'get-port';
import http from 'node:http';
import fg from 'fast-glob';
import pLimit from 'p-limit';

/* -------------------------------------------------------------------------- */
/** Configuration **/
/* -------------------------------------------------------------------------- */
const PROGRAM_ROOT = path.resolve(__dirname, '..');
const TESTS_ROOT = path.join(PROGRAM_ROOT, 'tests');
const PROGRAM_ID = '8JaW8fhu46ii83WapMp64i4B4bKTM76XUSXftJfHfLyg';
const PROGRAM_SO = path.join(PROGRAM_ROOT, 'target', 'deploy', 'baskt.so');
const MAX_VALIDATOR_STARTUP_MS = 60_000;
const VALIDATOR_POLL_INTERVAL_MS = 500;
const BASE_PORT = 11000;          // starting rpc port for first validator
const BLOCK_SIZE = 100;           // each validator gets 100 ports slice
const USDC_MINT_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const USDC_ACCOUNT_PATH = path.join(PROGRAM_ROOT, 'usdc-mock.json');
const WALLET_PATH = path.join(PROGRAM_ROOT, 'tests', 'utils', 'test-wallet.json');
let WALLET_PUBKEY = '';
try {
  WALLET_PUBKEY = execSync(`solana-keygen pubkey ${WALLET_PATH}`).toString().trim();
} catch {
  console.warn('Could not compute wallet pubkey via solana-keygen; mint flag will be skipped.');
}

const CONCURRENCY = Math.max(4, require('os').cpus().length || 4);

// Store results for each bucket
interface BucketResult {
  folder: string;
  pattern: string;
  success: boolean;
  logs: string;
  error?: string;
  duration: number;
}

/* -------------------------------------------------------------------------- */
/** Helpers **/
/* -------------------------------------------------------------------------- */
function discoverBuckets(): [string, string][] {
  const dirs = readdirSync(TESTS_ROOT).filter((name) => statSync(path.join(TESTS_ROOT, name)).isDirectory());

  return dirs.flatMap((dir) => {
    const pattern = `tests/${dir}/**/*.test.ts`;
    const files = fg.sync(pattern, { cwd: PROGRAM_ROOT });
    return files.length ? [[dir, pattern]] : []; // skip empty dirs (eg utils)
  });
}

function validateRequestedFolders(requestedFolders: string[]): [string, string][] {
  const availableBuckets = discoverBuckets();
  const availableFolders = availableBuckets.map(([folder]) => folder);
  
  const invalidFolders = requestedFolders.filter(folder => !availableFolders.includes(folder));
  
  if (invalidFolders.length > 0) {
    console.error(`❌  Invalid folder(s): ${invalidFolders.join(', ')}`);
    console.error(`📁  Available folders: ${availableFolders.join(', ')}`);
    process.exit(1);
  }
  
  return availableBuckets.filter(([folder]) => requestedFolders.includes(folder));
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForValidator(port: number) {
  const deadline = Date.now() + MAX_VALIDATOR_STARTUP_MS;
  while (Date.now() < deadline) {
    try {
      await new Promise<void>((resolve, reject) => {
        http
          .get(`http://127.0.0.1:${port}/health`, (res) => {
            res.statusCode === 200 ? resolve() : reject();
          })
          .on('error', reject);
      });
      // If we reached here, /health returned 200 OK
      return;
    } catch {
      // ignore – validator not ready yet
    }
    await wait(VALIDATOR_POLL_INTERVAL_MS);
  }
  throw new Error(`Validator on port ${port} failed to become healthy in time.`);
}

// Track child processes for clean shutdown
const validators: ChildProcess[] = [];
const mochas: ChildProcess[] = [];

function cleanUpChildren() {
  for (const proc of [...mochas, ...validators]) {
    try {
      // Kill entire process group (negative PID)
      if (proc.pid && typeof proc.pid === 'number') {
        process.kill(-proc.pid, 'SIGTERM');
        // Force kill process group after 2 seconds
        setTimeout(() => {
          try { process.kill(-proc.pid!, 'SIGKILL'); } catch {}
        }, 2000);
      }
    } catch {}
  }
}

['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal as NodeJS.Signals, () => {
    cleanUpChildren();
    process.exit(1);
  });
});

process.on('exit', () => {
  cleanUpChildren();
});
process.on('uncaughtException', (err) => {
  console.error(err);
  cleanUpChildren();
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  cleanUpChildren();
});

async function runBucket(bucket: [string, string], idx: number): Promise<BucketResult> {
  const [folder, pattern] = bucket;
  const startTime = Date.now();
  let logs = '';

  // Helper to capture output
  const appendLog = (data: string) => {
    logs += data;
  };

  try {
    // allocate deterministic rpc port block
    const rpcPort = BASE_PORT + idx * BLOCK_SIZE;
    // ensure rpcPort free (rare conflict) else pick in slice
    const port = await getPort({ port: portNumbers(rpcPort, rpcPort + 9) });
    const ledgerDir = path.join(tmpdir(), `ledger-${port}`);

    appendLog(`🧪  Starting validator for ${folder} on port ${port}\n`);

    const dynamicRange = `${port + 20}-${port + BLOCK_SIZE - 1}`;

    const validatorArgs = [
      '--reset',
      '--quiet',
      '--ledger', ledgerDir,
      '--rpc-port', String(port),
      '--faucet-port', String(port + 2),
      '--dynamic-port-range', dynamicRange,
      '--bind-address', '127.0.0.1',
      '--bpf-program', PROGRAM_ID, PROGRAM_SO,
      '--account', USDC_MINT_ADDRESS, USDC_ACCOUNT_PATH,
      ...(WALLET_PUBKEY ? ['--mint', WALLET_PUBKEY] : []),
    ];

    const validator = spawn('solana-test-validator', validatorArgs, { 
      stdio: ['ignore', 'pipe', 'pipe'], // capture stdout/stderr
      detached: true  // Create new process group
    });

    // Capture validator logs
    // validator.stdout?.on('data', (data) => appendLog(`[VALIDATOR] ${data}`));
    // validator.stderr?.on('data', (data) => appendLog(`[VALIDATOR] ${data}`));

    let validatorExited = false;
    validator.on('exit', (code, signal) => {
      validatorExited = true;
      if (code !== 0) {
        appendLog(`Validator process for ${folder} exited early with code ${code} signal ${signal}\n`);
      }
    });

    validators.push(validator);

    await waitForValidator(port).catch((err) => {
      if (validatorExited) {
        throw new Error(`Validator for ${folder} exited early.`);
      }
      throw err;
    });

    const env = {
      ...process.env,
      ANCHOR_PROVIDER_URL: `http://127.0.0.1:${port}`,
      ANCHOR_WALLET: path.join(PROGRAM_ROOT, 'tests', 'utils', 'test-wallet.json'),
      FORCE_COLOR: '1', // Force colors in output
    };

    appendLog(`→  Running tests in ${pattern}\n`);

    const mocha = spawn(
      'pnpm',
      ['exec', 'ts-mocha', '-p', './tsconfig.json', '-t', '1000000', '--color', pattern],
      {
        stdio: ['ignore', 'pipe', 'pipe'], // capture stdout/stderr
        cwd: PROGRAM_ROOT,
        env,
        detached: true  // Create new process group
      },
    );

    // Capture mocha logs
    mocha.stdout?.on('data', (data) => appendLog(data));
    mocha.stderr?.on('data', (data) => appendLog(data));

    mochas.push(mocha);

    return new Promise<BucketResult>((resolve) => {
      mocha.on('close', (code) => {
        // remove from arrays
        const idx = mochas.indexOf(mocha);
        if (idx !== -1) mochas.splice(idx, 1);

        validator.kill('SIGTERM');
        const vIdx = validators.indexOf(validator);
        if (vIdx !== -1) validators.splice(vIdx, 1);
        rmSync(ledgerDir, { recursive: true, force: true });

        const duration = Date.now() - startTime;
        const success = code === 0;

        if (success) {
          appendLog(`✅  ${folder} passed.\n`);
        } else {
          appendLog(`❌  ${folder} failed with code ${code}\n`);
        }

        resolve({
          folder,
          pattern,
          success,
          logs,
          error: success ? undefined : `Test failed with exit code ${code}`,
          duration
        });
      });
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    const errorMsg = err instanceof Error ? err.message : String(err);
    appendLog(`❌  ${folder} failed with error: ${errorMsg}\n`);
    
    return {
      folder,
      pattern,
      success: false,
      logs,
      error: errorMsg,
      duration
    };
  }
}

function printBucketResult(result: BucketResult, bucketIndex: number, totalBuckets: number) {
  const status = result.success ? '✅' : '❌';
  const duration = (result.duration / 1000).toFixed(1);
  
  console.log(`\n${'─'.repeat(80)}`);
  console.log(`${status}  BUCKET ${bucketIndex + 1}/${totalBuckets}: ${result.folder} (${duration}s)`);
  console.log(`📁  Pattern: ${result.pattern}`);
  if (result.error) {
    console.log(`🔥  Error: ${result.error}`);
  }
  console.log(`${'─'.repeat(80)}`);
  
  if (result.logs.trim()) {
    console.log(result.logs);
  } else {
    console.log('(No logs captured)');
  }
  
  console.log(`${'─'.repeat(80)}`);
}

function printFinalSummary(results: BucketResult[]) {
  console.log('\n' + '='.repeat(80));
  console.log('📊  FINAL SUMMARY');
  console.log('='.repeat(80));

  const passed = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`\n📈  RESULTS: ${passed.length}/${results.length} buckets passed`);
  console.log(`⏱️   Total time: ${Math.max(...results.map(r => r.duration))}ms (parallel)`);
  
  if (passed.length > 0) {
    console.log(`✅  Passed: ${passed.map(r => r.folder).join(', ')}`);
  }
  if (failed.length > 0) {
    console.log(`❌  Failed: ${failed.map(r => r.folder).join(', ')}`);
  }

  console.log(`\n${'='.repeat(80)}`);
}

function printUsage() {
  console.log('Usage: pnpm run test:suite <folder1> [folder2] [folder3] ...');
  console.log('');
  console.log('Available test folders:');
  const availableBuckets = discoverBuckets();
  availableBuckets.forEach(([folder]) => {
    console.log(`  - ${folder}`);
  });
  console.log('');
  console.log('Examples:');
  console.log('  pnpm run test:suite 1_protocol');
  console.log('  pnpm run test:suite 1_protocol 2_assets 3_baskt');
  console.log('  pnpm run test:suite 4_liquidity 5_order');
}

/* -------------------------------------------------------------------------- */
/** Main **/
/* -------------------------------------------------------------------------- */
(async () => {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      console.log('❌  No folders specified.');
      printUsage();
      process.exit(1);
    }

    // Check for help flag
    if (args.includes('--help') || args.includes('-h')) {
      printUsage();
      return;
    }

    // Step 1: build the program once so we can inject it into every validator
    console.log('🔨  Building Anchor program (once)...');
    execSync('anchor build', { stdio: 'inherit', cwd: PROGRAM_ROOT });

    // Optional: also rebuild the SDK so tests have fresh typings
    console.log('🔄  Building SDK...');
    execSync('pnpm --filter @baskt/sdk build', { stdio: 'inherit', cwd: PROGRAM_ROOT });

    // Step 2: validate and get requested buckets
    const buckets = validateRequestedFolders(args);
    if (buckets.length === 0) {
      console.log('No valid test folders found. Exiting.');
      return;
    }

    console.log(`\n🚀  Running ${buckets.length} test buckets in parallel (concurrency: ${CONCURRENCY})`);
    console.log(`📂  Requested folders: ${args.join(', ')}`);
    console.log(`⏳  Will show results as each bucket completes...\n`);

    // Track completed results and running buckets
    const completedResults: BucketResult[] = [];
    const runningBuckets = new Set<string>();
    let completedCount = 0;

    // Step 3: run buckets in parallel with real-time results
    const limit = pLimit(CONCURRENCY);
    const promises = buckets.map((bucket, idx) => 
      limit(async () => {
        const [folder] = bucket;
        
        // Mark bucket as running
        runningBuckets.add(folder);
        
        const result = await runBucket(bucket, idx);
        
        // Mark bucket as completed
        runningBuckets.delete(folder);
        
        // Print result immediately when this bucket completes
        completedCount++;
        printBucketResult(result, idx, buckets.length);
        
        // Show progress with remaining buckets
        const remaining = Array.from(runningBuckets);
        if (remaining.length > 0) {
          console.log(`\n📊  Progress: ${completedCount}/${buckets.length} buckets completed`);
          console.log(`⏳  Still running: ${remaining.join(', ')}`);
          
          // Show passed and failed buckets
          const passedBuckets = completedResults.filter(r => r && r.success).map(r => r.folder);
          const failedBuckets = completedResults.filter(r => r && !r.success).map(r => r.folder);
          if (passedBuckets.length > 0) console.log(`✅  Passed: ${passedBuckets.join(', ')}`);
          if (failedBuckets.length > 0) console.log(`❌  Failed: ${failedBuckets.join(', ')}`);
          console.log('');
        } else {
          console.log(`\n📊  Progress: ${completedCount}/${buckets.length} buckets completed - All done!\n`);
        }
        
        // Store result for final summary
        completedResults[idx] = result;
        
        return result;
      })
    );

    // Wait for all buckets to complete
    const results = await Promise.allSettled(promises);

    // Handle any rejected promises (shouldn't happen with our error handling, but just in case)
    const bucketResults: BucketResult[] = results.map((result, idx) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        // Promise was rejected
        const [folder, pattern] = buckets[idx];
        const errorResult = {
          folder,
          pattern,
          success: false,
          logs: '',
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
          duration: 0
        };
        // Print error result if it wasn't already printed
        if (!completedResults[idx]) {
          printBucketResult(errorResult, idx, buckets.length);
        }
        return errorResult;
      }
    });

    // Print final summary
    printFinalSummary(bucketResults);

    // Exit with error code if any tests failed
    const failedCount = bucketResults.filter(r => !r.success).length;
    if (failedCount > 0) {
      console.log(`\n💥  ${failedCount} bucket(s) failed.`);
      process.exit(1);
    } else {
      console.log('\n🎉  All buckets passed!');
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})(); 