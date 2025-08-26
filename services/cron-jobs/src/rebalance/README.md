# Rebalance Job Implementation

## Overview

The rebalance job is responsible for automatically checking and triggering basket rebalances based on configured periods and NAV deviation thresholds.

## Architecture

### Components

1. **Rebalance Manager** (`manager.ts`)
   - Runs as a cron job every hour
   - Checks all baskets for rebalance eligibility
   - Publishes rebalance requests to the data bus

2. **Rebalance Worker** (`worker.ts`) - Currently commented out
   - Would process rebalance requests from the queue
   - Actual rebalancing is now handled by the execution engine

### Rebalance Logic

The manager checks two conditions before triggering a rebalance:

1. **Time-based check**: `lastTimeRebalanced + rebalancePeriod < currentTimeInSeconds`
   - Ensures the rebalance period has elapsed

2. **NAV deviation check**: `|currentNAV - baselineNAV| / baselineNAV > 0.5%`
   - Ensures there's sufficient price movement to justify rebalancing

### Data Flow

```
Rebalance Manager → Check conditions → Publish to data bus → Execution Engine
```

1. Manager reads baskets from MongoDB
2. For each basket, checks on-chain data
3. If conditions are met, publishes to `STREAMS.rebalance.requested`
4. Execution engine consumes the event and performs the actual rebalance

### Configuration

Environment variables:
- `REDIS_URL`: Redis connection URL for data bus
- `DATABUS_SIGNING_KEY`: Key for signing data bus messages
- `SOLANA_RPC_URL`: Solana RPC endpoint
- `ANCHOR_WALLET`: Path to Solana wallet for transactions

### Running

The rebalance manager is configured in `ecosystem.config.js`:

```bash
pm2 start cron-jobs:rebalance-manager
```

Or run directly:

```bash
node dist/rebalance/manager.js
```

### Monitoring

The manager logs:
- Number of baskets checked
- Time until next rebalance for each basket
- NAV deviation calculations
- Rebalance requests published

Example output:
```
[10:30:00 AM] 🔍 Checking baskets for rebalance...
📊 BASKET123 - NAV deviation: 0.75% (current: 1050.00, baseline: 1042.00)
✅ BASKET123 - Rebalance requested (period: 86400s, deviation: 0.75%)
```

### Events

Published event structure:
```typescript
{
  rebalanceRequest: {
    basktId: PublicKey,
    creator: PublicKey,
    timestamp: BN,
    rebalanceRequestFee: BN
  },
  timestamp: string,
  txSignature: string
}
```