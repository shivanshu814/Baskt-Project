# Baskt Monorepo

This is a monorepo containing Baskt packages:

- `@baskt/program` - Solana program
- `@baskt/sdk` - SDK for interacting with the program

## Prerequisites

- Node.js (>=16.0.0)
- pnpm (>=8.0.0)
- Anchor (for Solana development)

## Setup

```bash
# Install dependencies
pnpm install
```

## Development

```bash
pnpm dev
```

## How to develop

We are going to do everything local for now.

The localblockchain must be startted on http://127.0.0.1:8899 using anchor localnet

All backend and the admin-app, main-app should also point to the local rpc.

For that we should do the following:

1. Setup .env file in admin-app / main-app / backend
2. Run the Anchor Localnet from packages/program
3. Run npx txc scripts/deploy-local.ts - This will deploy the program
4. pnpm dev from the monorepo root to start dev
