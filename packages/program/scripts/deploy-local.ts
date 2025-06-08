import dotenv from 'dotenv';
dotenv.config();
import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { join } from 'path';
import { homedir } from 'os';
import { BasktV1 } from '../target/types/baskt_v1';
import { TestClient } from '../tests/utils/test-client';
import BasktV1Idl from '../target/idl/baskt_v1.json';
import { AccessControlRole } from '@baskt/types';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../services/backend/src/router';
import { AssetPrice } from '../../../services/oracle/src/config/sequelize';

import assetConfig from './assets.json';
import { getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';

const shouldCreateFakePrices = process.argv.includes('--create-fake-prices');

const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:4000/trpc',
    }),
  ],
});

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
) {
  for (const asset of assets) {
    await trpc.asset.createAsset.mutate({
      name: asset.name,
      ticker: asset.ticker,
      assetAddress: asset.address,
      logo: asset.logo,
      priceConfig: {
        provider: asset.provider,
        twp: {
          seconds: 300,
        },
        updateFrequencySeconds: 15,
      },
    });
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

  const program = new anchor.Program<BasktV1>(BasktV1Idl, provider);
  console.log('Program ID:', program.programId.toString());

  return {
    provider,
    program,
    wallet,
  };
};

async function createFakePrices(assetConfig: any[]) {
  // We need to create a price feed for each asset which will be for an interval of 15 seconds
  // Then we store this price feed in the timescale DB
  const allAssetPrices = [];
  for (const asset of assetConfig) {
    let hour = Date.now();
    for (let i = 0; i < 24 * 365; i++) {
      allAssetPrices.push({
        asset_id: asset.address,
        price: new anchor.BN(Math.random() * 10000).mul(new anchor.BN(1e9)),
        time: hour,
      });
      hour -= 60 * 60 * 1000; // decrement by 1 hour
    }
  }
  console.log('Creating fake prices for assets');
  try {
    await AssetPrice.bulkCreate(allAssetPrices);
  } catch (error) {
    console.error('Error creating fake prices:', error);
  }
}

async function main() {
  const { program, wallet, provider } = getProvider();

  const client = new TestClient(program);
  client.setPublicKey(wallet.publicKey);

  await client.initializeProtocol();

  const assetsWithAddress = [];

  for (const asset of assetConfig) {
    const { assetAddress } = await client.addAsset(asset.ticker);
    assetsWithAddress.push({
      ...asset,
      address: assetAddress.toString(),
    });
  }

  try {
    await addAssetsToTrpc(assetsWithAddress);
    if (shouldCreateFakePrices) {
      await createFakePrices(assetsWithAddress);
    }
  } catch (error) {
    console.error('Error adding assets to backend:', error);
  }

  const fundingAccount = new PublicKey(process.env.FUNDING_ACCOUNT || '');

  // Giving some funding to the FUNDING_ACCOUNT
  const transaction = new anchor.web3.Transaction().add(
    anchor.web3.SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: fundingAccount,
      lamports: anchor.web3.LAMPORTS_PER_SOL * 10, // Transfer 10 SOL
    }),
  );

  await client.addRole(fundingAccount, AccessControlRole.Owner);

  console.log('Has Role', await client.hasRole(fundingAccount, AccessControlRole.Owner));

  if (program.provider.sendAndConfirm) await program.provider.sendAndConfirm(transaction);

  // === Create LP Mint and Token Vault for Liquidity Pool ===

  // 1. Derive PDAs
  const protocolPDA = await client.protocolPDA;
  const liquidityPoolPDA = await client.findLiquidityPoolPDA();
  const poolAuthorityPDA = await client.findPoolAuthorityPDA();
  console.log('Protocol PDA:', protocolPDA.toBase58());
  console.log('Liquidity Pool PDA:', liquidityPoolPDA.toBase58());
  console.log('Pool Authority PDA:', poolAuthorityPDA.toBase58());

  // 2. Use USDC as the collateral mint
  const usdcMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

  // 3. Create LP Mint (poolAuthorityPDA as mint authority)
  // const lpMintKeypair = Keypair.generate();
  // const lpMint = await createMint(
  //   provider.connection,
  //   wallet.payer,
  //   poolAuthorityPDA,
  //   null, // Freeze authority (optional)
  //   6, // Decimals (match USDC)
  //   lpMintKeypair,
  // );
  // console.log('LP Mint:', lpMintKeypair.publicKey.toBase58());

  // 4. Create Token Vault (owned by poolAuthorityPDA)
  // const tokenVault = await getOrCreateAssociatedTokenAccount(
  //   provider.connection,
  //   wallet.payer,
  //   usdcMint,
  //   poolAuthorityPDA,
  //   true,
  // );

  // console.log('Token Vault:', tokenVault.address.toBase58());

  // Give USDC to the funding account
  const usdcAta = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    wallet.payer,
    usdcMint,
    fundingAccount,
  );
  const usdcAmount = new anchor.BN(10_000 * 1e6);
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
  const basket = await client.createBaskt('Test Basket', assetsConfig, true);
  trpc.baskt.createBasktMetadata.mutate({
    basktId: basket.basktId.toString(),
    name: 'Test Basket',
    creator: wallet.publicKey.toString(),
    assets: assetsConfig.map((asset) => asset.assetId.toString()),
    image: '',
    rebalancePeriod: {
      value: 1,
      unit: 'day',
    },
    txSignature: basket.txSignature,
  });

  console.log('Deployment complete! Info saved to deployment-localnet.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
