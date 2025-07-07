import dotenv from 'dotenv';
dotenv.config();

import { getOrCreateAssociatedTokenAccount, createMint } from '@solana/spl-token';
import { getProvider } from '../utils';
import { Keypair, PublicKey } from '@solana/web3.js';
import { TestClient } from '../../tests/utils/test-client';

async function main() {
  const { program, wallet, provider } = getProvider(
    'https://attentive-long-replica.solana-mainnet.quiknode.pro/5338b0732eff649c847a73b9132b485b8e9d7346/',
  );
  const client = new TestClient(program);
  client.setPublicKey(wallet.publicKey);

  const poolAuthorityPDA = await client.findPoolAuthorityPDA();

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
  console.log('LP Mint Keypair:', lpMintKeypair.secretKey.toString());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
