import dotenv from 'dotenv';
dotenv.config();
import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { join } from 'path';
import { homedir } from 'os';
import { Baskt } from '../target/types/baskt';
import { TestClient } from '../tests/utils/test-client';
import BasktIdl from '../target/idl/baskt.json';

// Configure the provider.connection to devnet
export const getProvider = () => {
  // Configure cluster based on environment
  const cluster = process.env.ANCHOR_PROVIDER_URL || 'http://127.0.0.1:8899';
  const connection = new Connection(cluster, 'confirmed');
  console.log('Cluster:', cluster);
  // Configure wallet
  const walletPath = process.env.ANCHOR_WALLET || join(homedir(), '.config', 'solana', 'id.json');
  let wallet: anchor.Wallet;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const walletKeypair = require(walletPath);
    wallet = new anchor.Wallet(Keypair.fromSecretKey(new Uint8Array(walletKeypair)));
    console.log('Wallet address:', wallet.publicKey.toString());
  } catch (e) {
    console.error('Error loading wallet:', e);
    console.log('Falling back to new keypair wallet');
    wallet = new anchor.Wallet(Keypair.generate());
  }

  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
    preflightCommitment: 'confirmed',
  });

  const program = new anchor.Program<Baskt>(BasktIdl, provider);
  console.log('Program ID:', program.programId.toString());

  return {
    provider,
    program,
    wallet,
  };
};

async function main() {
  // Delete the entire DB

  const usdcMint = new PublicKey(
    process.env.NEXT_PUBLIC_USDC_MINT || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  );

  const { program, wallet, provider } = getProvider();

  const client = new TestClient(program);
  client.setPublicKey(wallet.publicKey);

  await client.initializeProtocol(wallet.publicKey);

  const lpMintKeypair = Keypair.generate();
  console.log('LP Mint:', lpMintKeypair.publicKey.toString());
  console.log('LP Mint Secret Key', lpMintKeypair.secretKey.toString());

  await client.initializeLiquidityPool(
    100,
    100,
    lpMintKeypair.publicKey,
    usdcMint,
    lpMintKeypair,
  );

  // 1. Derive PDAs
  const protocolPDA = await client.protocolPDA;
  const liquidityPoolPDA = await client.liquidityPoolPDA;
  const poolAuthorityPDA = await client.poolAuthorityPDA;
  console.log('Protocol PDA:', protocolPDA.toBase58());
  console.log('Liquidity Pool PDA:', liquidityPoolPDA.toBase58());
  console.log('Pool Authority PDA:', poolAuthorityPDA.toBase58());

  console.log('Deployment complete! Info saved to deployment-not-local.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
