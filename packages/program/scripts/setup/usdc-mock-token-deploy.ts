import dotenv from 'dotenv';
dotenv.config();

import { createMint } from '@solana/spl-token';
import { getProvider } from '../utils';
import { Keypair } from '@solana/web3.js';

async function main() {
  const { wallet, provider } = getProvider(
    'https://fabled-indulgent-seed.solana-devnet.quiknode.pro/19abbec85e908d5bdf453cc6bf35fb6d8d559b80/',
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
