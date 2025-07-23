# Baskt Program Deployment Guide

## Step 1: Initial Setup

1. Install dependencies from monorepo root:

```bash
pnpm install
```

2. Set up `.env` in admin app:

```bash
# apps/admin-app/.env
NEXT_PUBLIC_PRIVY_APP_ID=
NEXT_PUBLIC_SOLANA_RPC_URL="http://127.0.0.1:8899"
```

3. Set up `.env` in program folder:

```bash
# packages/program/.env
ANCHOR_PROVIDER_URL=http://127.0.0.1:8899
ANCHOR_WALLET=~/.config/account-name/deploy-keypair.json
FUNDING_ACCOUNT=<YOUR_WALLET_PUBLIC_ADDRESS>
```

Note: Replace `ANCHOR_WALLET` with your deploy keypair path and `FUNDING_ACCOUNT` with your wallet's public address

## Step 2: Start Local Network

1. Navigate to program folder:

```bash
cd packages/program
```

2. Start local validator:

```bash
anchor localnet
```

This will activate localhost:8899

## Step 3: Build and Deploy

1. While in `packages/program`, run:

```bash
anchor build
anchor deploy
```

2. After deploy, note the new program ID. It will be automatically updated in:

- `packages/program/src/lib.rs`
- `packages/program/Anchor.toml`

3. Manually update the program ID in:

- `scripts/baskt_v1.json`
- `scripts/deployment-localnet.json`
- `packages/sdk/src/baskt_v1.ts`

## Step 4: Validate Environment

1. Verify environment variables:

```bash
echo "ANCHOR_PROVIDER_URL: $ANCHOR_PROVIDER_URL"
echo "ANCHOR_WALLET: $ANCHOR_WALLET"
echo "FUNDING_ACCOUNT: $FUNDING_ACCOUNT"
```

2. Get some SOL for testing:

```bash
solana airdrop 100
```

## Step 5: Run Deployment Script

1. From monorepo root, run:

```bash
npx tsx scripts/deploy-local.ts
```

## Troubleshooting

If you see this error:

```
SendTransactionError: Simulation failed.
Message: Transaction simulation failed: Attempt to load a program that does not exist.
```

This means:

1. Program ID mismatch in configuration files
2. Make sure to update program ID in all required files after `anchor build` and `anchor deploy`

## Verification

After successful deployment, you should see output with:

- Program ID
- Protocol PDA
- Lookup Table
- Asset addresses and oracles

You can verify program status using:

```bash
solana program show <PROGRAM_ID>
```
