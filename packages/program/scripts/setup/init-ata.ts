import dotenv from 'dotenv';
dotenv.config();

import { createMint, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import { getProvider } from '../utils';
import { Keypair, PublicKey } from '@solana/web3.js';

async function main() {
  const { wallet, provider } = getProvider(
    'https://attentive-long-replica.solana-mainnet.quiknode.pro/5338b0732eff649c847a73b9132b485b8e9d7346/',
  );

  const account = new PublicKey(process.argv[2]);
  const mint = new PublicKey(process.argv[3]);
  const isPDA = process.argv[4] === 'true';


  const ata = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    wallet.payer,
    mint,    
    wallet.publicKey,
    isPDA,
  );

  console.log('ATA:', ata.address.toBase58());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
