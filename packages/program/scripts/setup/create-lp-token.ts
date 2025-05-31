import dotenv from 'dotenv';
dotenv.config();

import { getOrCreateAssociatedTokenAccount, createMint } from '@solana/spl-token';
import { getProvider } from '../utils';
import { Keypair, PublicKey } from '@solana/web3.js';
import { TestClient } from '../../tests/utils/test-client';

async function main() {
  const { program, wallet, provider } = getProvider(
    'https://fabled-indulgent-seed.solana-devnet.quiknode.pro/19abbec85e908d5bdf453cc6bf35fb6d8d559b80/',
  );
  const client = new TestClient(program);
  client.setPublicKey(wallet.publicKey);

  // Derive PDAs
  const protocolPDA = await client.protocolPDA;
  const liquidityPoolPDA = await client.findLiquidityPoolPDA();
  const poolAuthorityPDA = await client.findPoolAuthorityPDA(liquidityPoolPDA);
  console.log('Protocol PDA:', protocolPDA.toBase58());
  console.log('Liquidity Pool PDA:', liquidityPoolPDA.toBase58());
  console.log('Pool Authority PDA:', poolAuthorityPDA.toBase58());

  // Use USDC as the collateral mint
  const usdcMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

  // Create LP Mint
  const lpMintKeypair = Keypair.generate();
  const lpMint = await createMint(
    provider.connection,
    wallet.payer,
    poolAuthorityPDA,
    null,
    6,
    lpMintKeypair,
  );
  console.log('LP Mint:', lpMint.toBase58());

  // Create Token Vault
  const tokenVault = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    wallet.payer,
    usdcMint,
    poolAuthorityPDA,
    true,
  );
  console.log('Token Vault:', tokenVault.address.toBase58());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
