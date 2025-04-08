import dotenv from 'dotenv';
dotenv.config();
import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import fs from 'fs';
import path, { join } from 'path';
import { homedir } from 'os';
import { BasktV1 } from '../target/types/baskt_v1';
import { TestClient } from '../tests/utils/test-client';
import { BasktV1Idl } from 'packages/sdk/src/program/idl';
import { AccessControlRole } from '@baskt/sdk';

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
  const { assetAddress: btcAssetAddress, oracle: btcOracle } =
    await client.createAndAddAssetWithCustomOracle('BTC', 50_000, undefined, undefined, 100, 300);
  const { assetAddress: ethAssetAddress, oracle: ethOracle } =
    await client.createAndAddAssetWithCustomOracle('ETH', 3_000, undefined, undefined, 100, 300);
  const { assetAddress: dogeAssetAddress, oracle: dogeOracle } =
    await client.createAndAddAssetWithCustomOracle('DOGE', 10, undefined, undefined, 100, 300);
  const { assetAddress: solAssetAddress, oracle: solOracle } =
    await client.createAndAddAssetWithCustomOracle('SOL', 100, undefined, undefined, 100, 300);
  const { assetAddress: adaAssetAddress, oracle: adaOracle } =
    await client.createAndAddAssetWithCustomOracle('ADA', 1, undefined, undefined, 100, 300);

  // Save deployment info
  const deployInfo = {
    programId: program.programId.toString(),
    protocolPDA: client.protocolPDA.toString(),
    lookupTable: client.lookupTable?.toString(),
    assets: [
      { assetAddress: btcAssetAddress.toString(), oracle: btcOracle.toString() },
      { assetAddress: ethAssetAddress.toString(), oracle: ethOracle.toString() },
      { assetAddress: dogeAssetAddress.toString(), oracle: dogeOracle.toString() },
      { assetAddress: solAssetAddress.toString(), oracle: solOracle.toString() },
      { assetAddress: adaAssetAddress.toString(), oracle: adaOracle.toString() },
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
