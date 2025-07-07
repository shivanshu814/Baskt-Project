import dotenv from 'dotenv';
dotenv.config();

import { createMint } from '@solana/spl-token';
import { getProvider } from '../utils';
import { Keypair } from '@solana/web3.js';

async function main() {
  const { wallet, provider } = getProvider(
    'https://attentive-long-replica.solana-mainnet.quiknode.pro/5338b0732eff649c847a73b9132b485b8e9d7346/',
  );

  const tokenKeypair = Keypair.generate();

  // Use USDC as the collateral mint
  const usdcMockMint = await createMint(
    provider.connection,
    wallet.payer,
    wallet.publicKey,
    null,
    6,
    tokenKeypair,
  );

  console.log('USDC Mock Mint:', usdcMockMint.toBase58());
  console.log('Token Keypair:', tokenKeypair.publicKey.toBase58());
  console.log('Token Keypair Secret:', tokenKeypair.secretKey.toString());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
