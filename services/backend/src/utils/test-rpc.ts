import { SDKClient } from './index';
import { PublicKey } from '@solana/web3.js';

interface Stats {
    totalRequests: number;
    successfulRequests: number;
    rateLimitedRequests: number;
    otherErrors: number;
    successRate: number;
    actualRPS: number;
    targetRPS: number;
}

class PositionRateLimitTester {
    private sdkClient: SDKClient;
    private targetPosition: PublicKey;
    private requestsPerSecond: number;
    private requestCount: number;
    private successfulCount: number;
    private rateLimitedCount: number;
    private otherErrorCount: number;
    private isRunning: boolean;
    private intervalId?: NodeJS.Timeout;
    private statsInterval?: NodeJS.Timeout;
    private startTime: number = 0;

    constructor() {
        process.env.SOLANA_RPC_URL = 'https://delicate-solitary-meadow.solana-devnet.quiknode.pro/4fd2482d2454b1074b511a39b7b592849c81079f/';
        this.sdkClient = new SDKClient();
        this.targetPosition = new PublicKey('2kntbJLh1nKtW2MRCwRynK3CXwANLxP4JLKLKqyFhoJD');
        this.requestsPerSecond = 50; // Default value
        this.requestCount = 0;
        this.successfulCount = 0;
        this.rateLimitedCount = 0;
        this.otherErrorCount = 0;
        this.isRunning = false;
    }

    public setRequestsPerSecond(rps: number): void {
        this.requestsPerSecond = rps;
        console.log(`Set target requests per second to: ${rps}`);
    }

    private async readPosition(): Promise<void> {
        try {
            await this.sdkClient.getBaskt(this.targetPosition);
            this.successfulCount++;
            this.requestCount++;
        } catch (error: any) {
            this.requestCount++;            
            // Check if it's a rate limit error
            if (error.message?.includes('429') || 
                error.message?.includes('rate limit') || 
                error.message?.includes('too many requests') ||
                error.message?.includes('429 Too Many Requests')) {
                this.rateLimitedCount++;
            } else {
                this.otherErrorCount++;
            }
        }
    }

    public start(): void {
        if (this.isRunning) {
            console.log('Already running!');
            return;
        }

        this.isRunning = true;
        this.startTime = Date.now();
        console.log(`Starting Position Rate Limit Tester...`);
        console.log(`Target position: ${this.targetPosition.toString()}`);
        console.log(`Target RPS: ${this.requestsPerSecond}`);
        console.log('Press Ctrl+C to stop\n');

        const intervalMs = 1000 / this.requestsPerSecond;
        
        this.intervalId = setInterval(async () => {
            await this.readPosition();
        }, intervalMs);

        // Print stats every 10 seconds
        this.statsInterval = setInterval(() => {
            this.printStats();
        }, 10000);
    }

    public stop(): void {
        if (!this.isRunning) {
            console.log('Not currently running!');
            return;
        }

        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
        if (this.statsInterval) {
            clearInterval(this.statsInterval);
            this.statsInterval = undefined;
        }
        
        console.log('\nStopped. Final stats:');
        this.printFinalStats();
    }

    public updateRPS(newRPS: number): void {
        if (this.isRunning) {
            this.stop();
            this.setRequestsPerSecond(newRPS);
            setTimeout(() => this.start(), 1000);
        } else {
            this.setRequestsPerSecond(newRPS);
        }
    }

    private printStats(): void {
        const elapsedSeconds = (Date.now() - this.startTime) / 1000;
        const actualRPS = this.requestCount / elapsedSeconds;
        
        console.log(`\n--- Stats (${elapsedSeconds.toFixed(1)}s elapsed) ---`);
        console.log(`Total requests: ${this.requestCount}`);
        console.log(`Successful: ${this.successfulCount}`);
        console.log(`Rate limited: ${this.rateLimitedCount}`);
        console.log(`Other errors: ${this.otherErrorCount}`);
        console.log(`Success rate: ${this.getSuccessRate().toFixed(2)}%`);
        console.log(`Target RPS: ${this.requestsPerSecond}`);
        console.log(`Actual RPS: ${actualRPS.toFixed(2)}`);
        console.log(`Rate limit frequency: ${this.getRateLimitFrequency().toFixed(2)}%`);
    }

    private printFinalStats(): void {
        const elapsedSeconds = (Date.now() - this.startTime) / 1000;
        const actualRPS = this.requestCount / elapsedSeconds;
        
        console.log(`\n=== FINAL RESULTS ===`);
        console.log(`Duration: ${elapsedSeconds.toFixed(1)} seconds`);
        console.log(`Total requests: ${this.requestCount}`);
        console.log(`Successful: ${this.successfulCount}`);
        console.log(`Rate limited: ${this.rateLimitedCount}`);
        console.log(`Other errors: ${this.otherErrorCount}`);
        console.log(`Success rate: ${this.getSuccessRate().toFixed(2)}%`);
        console.log(`Target RPS: ${this.requestsPerSecond}`);
        console.log(`Actual RPS: ${actualRPS.toFixed(2)}`);
        console.log(`Rate limit frequency: ${this.getRateLimitFrequency().toFixed(2)}%`);
        console.log(`Rate limited every ${(elapsedSeconds / this.rateLimitedCount).toFixed(1)} seconds (avg)`);
    }

    private getSuccessRate(): number {
        return (this.successfulCount / Math.max(this.requestCount, 1)) * 100;
    }

    private getRateLimitFrequency(): number {
        return (this.rateLimitedCount / Math.max(this.requestCount, 1)) * 100;
    }

    public getStats(): Stats {
        const elapsedSeconds = (Date.now() - this.startTime) / 1000;
        const actualRPS = this.requestCount / elapsedSeconds;
        
        return {
            totalRequests: this.requestCount,
            successfulRequests: this.successfulCount,
            rateLimitedRequests: this.rateLimitedCount,
            otherErrors: this.otherErrorCount,
            successRate: this.getSuccessRate(),
            actualRPS: actualRPS,
            targetRPS: this.requestsPerSecond
        };
    }
}

// Command line argument parsing
const args: string[] = process.argv.slice(2);
const tester = new PositionRateLimitTester();

// Parse command line arguments
for (let i = 0; i < args.length; i++) {
    if (args[i] === '--rps' || args[i] === '-r') {
        const rps = parseInt(args[i + 1]);
        if (rps && rps > 0) {
            tester.setRequestsPerSecond(rps);
        } else {
            console.error('Invalid RPS value. Must be a positive number.');
            process.exit(1);
        }
        i++; // Skip next argument as it was the RPS value
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nReceived SIGINT, shutting down gracefully...');
    tester.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM, shutting down gracefully...');
    tester.stop();
    process.exit(0);
});

// Interactive mode for changing RPS during runtime
process.stdin.setEncoding('utf8');
process.stdin.on('readable', () => {
    const chunk = process.stdin.read();
    if (chunk !== null) {
        const input = (chunk as string).trim();
        if (input.startsWith('rps ')) {
            const newRPS = parseInt(input.split(' ')[1]);
            if (newRPS && newRPS > 0) {
                tester.updateRPS(newRPS);
            } else {
                console.log('Invalid RPS value. Usage: rps <number>');
            }
        } else if (input === 'help') {
            console.log('\nCommands:');
            console.log('  rps <number> - Change requests per second');
            console.log('  help         - Show this help');
            console.log('  stats        - Show current statistics');
            console.log('  Ctrl+C       - Exit\n');
        } else if (input === 'stats') {
            const stats = tester.getStats();
            console.log('\n--- Current Stats ---');
            console.log(`Total requests: ${stats.totalRequests}`);
            console.log(`Successful: ${stats.successfulRequests}`);
            console.log(`Rate limited: ${stats.rateLimitedRequests}`);
            console.log(`Other errors: ${stats.otherErrors}`);
            console.log(`Success rate: ${stats.successRate.toFixed(2)}%`);
            console.log(`Target RPS: ${stats.targetRPS}`);
            console.log(`Actual RPS: ${stats.actualRPS.toFixed(2)}`);
        }
    }
});

// Show usage information
if (args.includes('--help') || args.includes('-h')) {
    console.log('Position Rate Limit Tester');
    console.log('Tests how often you get rate limited when calling getPosition at different RPS');
    console.log('');
    console.log('Usage: tsx test-rpc.ts [options]');
    console.log('');
    console.log('Options:');
    console.log('  --rps, -r <number>    Set target requests per second (default: 50)');
    console.log('  --help, -h            Show this help message');
    console.log('');
    console.log('Environment Variables:');
    console.log('  SOLANA_RPC_URL        Solana RPC endpoint');
    console.log('  ANCHOR_WALLET         Path to Solana wallet keypair');
    console.log('');
    console.log('Interactive Commands (while running):');
    console.log('  rps <number>          Change requests per second');
    console.log('  stats                 Show current statistics');
    console.log('  help                  Show interactive help');
    console.log('');
    console.log('Examples:');
    console.log('  tsx test-rpc.ts                    # Use default 50 RPS');
    console.log('  tsx test-rpc.ts --rps 100         # Use 100 RPS');
    console.log('  tsx test-rpc.ts --rps 25          # Use 25 RPS');
    process.exit(0);
}

// Start the tester
tester.start();

console.log('\nInteractive mode: Type "rps <number>" to change rate, "stats" for current stats, "help" for commands');

export default PositionRateLimitTester;