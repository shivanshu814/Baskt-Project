import { getProvider } from '../utils';
import { Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { createSetAuthorityInstruction, AuthorityType, getMint } from '@solana/spl-token';

async function main() {
  const { wallet, provider } = getProvider(
    'https://fabled-indulgent-seed.solana-devnet.quiknode.pro/19abbec85e908d5bdf453cc6bf35fb6d8d559b80/',
  );

  const tokenKeypair = Keypair.fromSecretKey(
    Uint8Array.from([207,23,204,192,93,152,5,222,39,13,3,74,139,137,140,242,129,28,140,36,82,191,207,189,205,44,242,172,140,178,49,72,191,229,35,57,127,190,29,200,10,40,222,50,21,230,221,75,182,165,170,2,52,118,143,225,191,17,50,74,189,110,39,162]),
  );

  console.log(tokenKeypair.publicKey.toBase58());

  const MINT = new PublicKey('Dv5XCiVvpvrMgEo5MuBYX6P4ce9dU3f5vubN6XVahMzR');

  const mintAccount = await getMint(
    provider.connection,
    MINT,
  );

  console.log('Mint Account:', mintAccount);
  console.log('Mint Authority:', mintAccount.mintAuthority?.toBase58());

  console.log('Token Keypair Public Key:', tokenKeypair.publicKey.toBase58());

  const newMintAuthority = Keypair.fromSecretKey(
    Buffer.from(
      'uXb1D9H0qDO4o0EvSy6U0QB0seqk7gnpWpNJAQNXvFV/BE6Rod1zMqIb44vJgTFUtVrC1tZK+u+6MedlEk+k+w==',
      'base64',
    ),
  );
  console.log('New Mint Authority Public Key:', newMintAuthority.publicKey.toBase58());
  console.log(
    'New Mint Authority Secret Key:',
    Buffer.from(newMintAuthority.secretKey).toString('base64'),
  );

  const transaction = new Transaction().add(
    createSetAuthorityInstruction(
      MINT,
      wallet.publicKey,
      AuthorityType.MintTokens,
      newMintAuthority.publicKey,
    ),
  );

  const signature = await provider.sendAndConfirm(transaction, [wallet.payer]);
  console.log('Transaction signature:', signature);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
