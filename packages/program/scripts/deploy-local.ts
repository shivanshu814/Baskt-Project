import dotenv from 'dotenv';
dotenv.config();
import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import fs from 'fs';
import path, { join } from 'path';
import { homedir } from 'os';
import { BasktV1 } from '../target/types/baskt_v1';
import { TestClient } from '../tests/utils/test-client';
import BasktV1Idl from '../target/idl/baskt_v1.json';
import { AccessControlRole } from '@baskt/types';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../services/backend/src/router';

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
  const trpc = createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: 'http://localhost:4000/trpc',
      }),
    ],
  });

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

async function main() {
  const { program, wallet } = getProvider();

  const client = new TestClient(program);
  client.setPublicKey(wallet.publicKey);

  await client.initializeProtocol();

  // Add 5 Assets to be used for us
  const { assetAddress: btcAssetAddress } = await client.addAsset('BTC');
  const { assetAddress: ethAssetAddress } = await client.addAsset('ETH');
  const { assetAddress: dogeAssetAddress } = await client.addAsset('DOGE');
  const { assetAddress: solAssetAddress } = await client.addAsset('SOL');
  const { assetAddress: adaAssetAddress } = await client.addAsset('ADA');

  // Add all the assets and their configs to the Backend

  try {
    await addAssetsToTrpc([
      {
        ticker: 'BTC',
        name: 'Bitcoin',
        address: btcAssetAddress.toString(),
        logo: 'https://assets.coingecko.com/coins/images/1/standard/bitcoin.png',
        provider: {
          id: 'BTCUSDT',
          chain: '',
          name: 'binance',
        },
      },
      {
        name: 'Ethereum',
        ticker: 'ETH',
        address: ethAssetAddress.toString(),
        logo: 'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
        provider: {
          id: 'ETHUSDT',
          chain: '',
          name: 'binance',
        },
      },
      {
        name: 'Dogecoin',
        ticker: 'DOGE',
        address: dogeAssetAddress.toString(),
        logo: 'https://assets.coingecko.com/coins/images/5/standard/dogecoin.png',
        provider: {
          id: 'DOGEUSDT',
          chain: '',
          name: 'binance',
        },
      },
      {
        name: 'Solana',
        ticker: 'SOL',
        address: solAssetAddress.toString(),
        logo: 'https://assets.coingecko.com/coins/images/4128/standard/solana.png',
        provider: {
          id: 'SOLUSDT',
          chain: '',
          name: 'binance',
        },
      },
      {
        name: 'Cardano',
        ticker: 'ADA',
        address: adaAssetAddress.toString(),
        logo: 'https://assets.coingecko.com/coins/images/975/standard/cardano.png',
        provider: {
          id: 'ADAUSDT',
          chain: '',
          name: 'binance',
        },
      },
    ]);
  } catch (error) {
    console.error('Error adding assets to backend:', error);
  }

  // Save deployment info
  const deployInfo = {
    programId: program.programId.toString(),
    protocolPDA: client.protocolPDA.toString(),
    lookupTable: client.lookupTable?.toString(),
    assets: [
      { assetAddress: btcAssetAddress.toString() },
      { assetAddress: ethAssetAddress.toString() },
      { assetAddress: dogeAssetAddress.toString() },
      { assetAddress: solAssetAddress.toString() },
      { assetAddress: adaAssetAddress.toString() },
    ],
  };

  const deployDir = path.join(__dirname);
  if (!fs.existsSync(deployDir)) {
    fs.mkdirSync(deployDir, { recursive: true });
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

  console.log(
    'Funding Account:',
    fundingAccount.toString(),
    await program.provider.connection.getBalance(fundingAccount),
  );

  fs.writeFileSync(
    path.join(deployDir, 'deployment-localnet.json'),
    JSON.stringify(deployInfo, null, 2),
  );

  console.log('Deployment complete! Info saved to deployment-localnet.json');
  console.log(deployInfo);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
