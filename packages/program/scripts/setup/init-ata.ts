import dotenv from 'dotenv';
dotenv.config();

import { createMint, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import { getProvider } from '../utils';
import { Keypair, PublicKey } from '@solana/web3.js';

async function main() {
  const { wallet, provider } = getProvider(
    'https://fabled-indulgent-seed.solana-devnet.quiknode.pro/19abbec85e908d5bdf453cc6bf35fb6d8d559b80/',
  );

  const minuAuthority = Keypair.fromSecretKey(
    Buffer.from(
      'VaRGq1AFa5RE3fNLTPyccv4P+TxcGAdBIgnFels/9QAmgragKEoiByXnTP/diVXlNlnga0bjRQI7XtXkkMgXDQ==',
      'base64',
    ),
  );
  
  console.log(minuAuthority.publicKey.toBase58());
  

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
