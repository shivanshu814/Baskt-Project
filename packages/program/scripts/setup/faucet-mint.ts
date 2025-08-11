import dotenv from 'dotenv';
dotenv.config();

import { createMint, getMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import { getProvider } from '../utils';
import { Keypair, PublicKey } from '@solana/web3.js';

async function main() {
  const { wallet, provider } = getProvider(
    'https://fabled-indulgent-seed.solana-devnet.quiknode.pro/19abbec85e908d5bdf453cc6bf35fb6d8d559b80/',
  );


  const account = new PublicKey("BLMLnp7mYcHWRSeiZi39AH7yx7hLLmGC35uHzdYPzwkd");
  console.log('Account:', account.toBase58());
  const mint = new PublicKey("Dv5XCiVvpvrMgEo5MuBYX6P4ce9dU3f5vubN6XVahMzR");
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

  const mintAuthority = Keypair.fromSecretKey(
    Buffer.from(
      'uXb1D9H0qDO4o0EvSy6U0QB0seqk7gnpWpNJAQNXvFV/BE6Rod1zMqIb44vJgTFUtVrC1tZK+u+6MedlEk+k+w==',
      'base64',
    ),
  );

  console.log('Mint', await mintTo(
    provider.connection,
    wallet.payer,
    mint,
    ata.address,
    mintAuthority.publicKey,
    10_000 * 1e6,
    [mintAuthority],
  ))



  console.log("Sol Balance:", await provider.connection.getBalance(account));
  console.log('ATA:', ata.address.toBase58());
  console.log('ATA Balance:', await provider.connection.getTokenAccountBalance(ata.address)); 




  
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
