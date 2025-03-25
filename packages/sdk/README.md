# Baskt SDK

This SDK provides a client for interacting with the Baskt protocol on Solana. It imports the IDL and types from the program package and exposes helper functions.

## Installation

Since this is a local package in a monorepo, you can reference it in your project's package.json:

```json
{
  "dependencies": {
    "sdk": "*"
  }
}
```

## Usage

```typescript
import { BasktClient } from 'sdk';
import { Connection, Keypair } from '@solana/web3.js';
import { Wallet } from '@coral-xyz/anchor';

// Create a connection to the Solana cluster
const connection = new Connection('https://api.devnet.solana.com');

// Create a wallet from a keypair
const wallet = new Wallet(Keypair.generate());

// Initialize the Baskt client
const basktClient = new BasktClient(connection, wallet);

// Example: Initialize the protocol
async function initializeProtocol() {
  const txSignature = await basktClient.initializeProtocol();
  console.log('Protocol initialized:', txSignature);
}

// Example: Get protocol account data
async function getProtocolData() {
  const protocolData = await basktClient.getProtocolAccount();
  console.log('Protocol data:', protocolData);
}
```

## Features

- Initialize and interact with the Baskt protocol
- Create and manage oracle accounts
- Add and manage synthetic assets
- Access to the program's IDL and types

## Development

To build the SDK:

```bash
yarn build
```

To run tests:

```bash
yarn test
```
