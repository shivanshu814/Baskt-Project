import dotenv from 'dotenv';
dotenv.config();

import { createMint, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import { getProvider } from '../utils';
import { Keypair, PublicKey } from '@solana/web3.js';

async function main() {
  const { wallet, provider } = getProvider(
    'https://attentive-long-replica.solana-mainnet.quiknode.pro/5338b0732eff649c847a73b9132b485b8e9d7346/',
  );


  const account = new PublicKey("6eEovMpy9rY8bQ3MYdM5D57xMpEAB2XJZ6eMURZZG1Wn");
  console.log('Account:', account.toBase58());
  const mint = new PublicKey("6uBc97h6XMKY4kqQ3DJA9R8y9AXC7yUMsm7AUxM8QKpr");
  const isPDA = process.argv[4] === 'true';

  console.log('Mint:', mint.toBase58());
  console.log('Is PDA:', isPDA);


  const ata = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    wallet.payer,
    mint,    
    account,
    isPDA,
  );

  console.log("Sol Balance:", await provider.connection.getBalance(account));
  console.log('ATA:', ata.address.toBase58());
  console.log('ATA Balance:', await provider.connection.getTokenAccountBalance(ata.address)); 


  
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
