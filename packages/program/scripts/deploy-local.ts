import dotenv from 'dotenv';
dotenv.config();
import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { join } from 'path';
import { homedir } from 'os';
import { Baskt } from '../target/types/baskt';
import { TestClient } from '../tests/utils/test-client';
import BasktIdl from '../target/idl/baskt.json';
import { AccessControlRole } from '@baskt/types';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../services/backend/src/router';
import { AssetPrice } from '../../../services/cron-jobs/src/config/sequelize';

import assetConfig from './assets.json';
import { getMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import { createQuerier, Querier } from '../../querier/src/querier';
import { BN } from '@coral-xyz/anchor';



async function addAssetsToTrpc(
  assets: {
    ticker: string;
    name: string;
    address: string;
    logo: string;
    provider: {
      id: string;
      chain: string;
      name: string;
    };
  }[],
  querier: Querier,
) {
  for (const asset of assets) {

    const assetMetadata = await querier.metadata.createAsset({
      assetAddress: asset.address,
      basktIds: [],
      name: asset.name,
      ticker: asset.ticker,
      logo: asset.logo,
      priceConfig: {
        provider: asset.provider,
        twp: {
          seconds: 300,
        },
        updateFrequencySeconds: 15,
        units: 1,
      },
      isActive: true,
      listingTime: Date.now(),
      permissions: {
        allowLongs: true,
        allowShorts: true,
      },  
      allTimeLongVolume: new BN(0),
      allTimeShortVolume: new BN(0),
      createdAt: new Date(),
      updatedAt: new Date(),
    });


    console.log('Asset added to Trpc:', asset.ticker);
  }
}

// Configure the provider.connection to devnet
export const getProvider = () => {
  // Configure cluster based on environment
  const cluster = 'http://127.0.0.1:8899';
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

  console.log('Starting deployment');

  const usdcMint = new PublicKey(
    process.env.NEXT_PUBLIC_USDC_MINT || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  );

  const { program, wallet, provider } = getProvider();
  const fundingAccount = new PublicKey(process.env.FUNDING_ACCOUNT || '');

  const transaction = new anchor.web3.Transaction().add(
    anchor.web3.SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: fundingAccount,
      lamports: anchor.web3.LAMPORTS_PER_SOL * 10, // Transfer 10 SOL
    }),
  );

  await provider.sendAndConfirm(transaction);
  
  console.log('Funding account balance:', await provider.connection.getBalance(fundingAccount));
  console.log('Wallet balance:', await provider.connection.getBalance(wallet.publicKey));



  const client = new TestClient(program);
  client.setPublicKey(wallet.publicKey);

  await client.initializeProtocol(wallet.publicKey);

  const querier = createQuerier(client);


  // Create ATA for the treasury
  const treasuryATA = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    wallet.payer,
    usdcMint,
    wallet.publicKey,
  );

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

  const assetsWithAddress = [];

  for (const asset of assetConfig) {
    const { assetAddress } = await client.addAsset(asset.ticker);
    assetsWithAddress.push({
      ...asset,
      address: assetAddress.toString(),
    });
  }

  try {
    await addAssetsToTrpc(assetsWithAddress, querier);
  } catch (error) {
    console.error('Error adding assets to backend:', error);
  }


  await client.addRole(fundingAccount, AccessControlRole.Owner);

  // if (program.provider.sendAndConfirm) await program.provider.sendAndConfirm(transaction);

  // 1. Derive PDAs
  const protocolPDA = await client.protocolPDA;
  const liquidityPoolPDA = await client.liquidityPoolPDA;
  const poolAuthorityPDA = await client.poolAuthorityPDA;
  console.log('Protocol PDA:', protocolPDA.toBase58());
  console.log('Liquidity Pool PDA:', liquidityPoolPDA.toBase58());
  console.log('Pool Authority PDA:', poolAuthorityPDA.toBase58());

  // Give USDC to the funding account
  const usdcAta = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    wallet.payer,
    usdcMint,
    fundingAccount,
  );
  const usdcAmount = new anchor.BN(10_000 * 1e6);

  console.log((await getMint(provider.connection, usdcMint)).mintAuthority?.toString());

  await mintTo(
    provider.connection,
    wallet.payer,
    usdcMint,
    usdcAta.address,
    wallet.payer,
    usdcAmount.toNumber(),
  );

  const assetsConfig = [
    {
      assetId: new PublicKey(assetsWithAddress[0].address),
      weight: new anchor.BN(5000),
      direction: true,
      baselinePrice: new anchor.BN(0),
    },
    {
      assetId: new PublicKey(assetsWithAddress[1].address),
      weight: new anchor.BN(5000),
      direction: false,
      baselinePrice: new anchor.BN(0),
    },
  ];

  // Lets also just create a baskt
  const basket = await client.createBaskt(assetsConfig, true);
  console.log('Basket created', basket);
  console.log('Deployment complete! Info saved to deployment-localnet.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
