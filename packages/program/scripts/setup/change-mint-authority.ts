import { getProvider } from '../utils';
import { Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { createSetAuthorityInstruction, AuthorityType, getMint } from '@solana/spl-token';

async function main() {
  const { wallet, provider } = getProvider(
    'https://fabled-indulgent-seed.solana-devnet.quiknode.pro/19abbec85e908d5bdf453cc6bf35fb6d8d559b80/',
  );

  const tokenKeypair = Keypair.fromSecretKey(
    Uint8Array.from([116,22,28,62,203,238,144,135,3,143,172,38,151,37,175,70,222,253,173,233,237,157,94,245,254,79,184,185,118,112,245,62,34,23,202,54,145,104,187,233,130,38,158,87,195,116,212,45,167,152,45,200,40,52,85,234,69,19,177,193,157,142,156,195]),
  );

  const mintAccount = await getMint(
    provider.connection,
    new PublicKey('3J5uJ5Pn8yrLwraQSmNMDYFAw59tf2mPTbMxBTtEFx3t'),
  );

  console.log('Mint Account:', mintAccount);
  console.log('Mint Authority:', mintAccount.mintAuthority?.toBase58());

  console.log('Token Keypair Public Key:', tokenKeypair.publicKey.toBase58());

  const newMintAuthority = Keypair.generate();
  console.log('New Mint Authority Public Key:', newMintAuthority.publicKey.toBase58());
  console.log(
    'New Mint Authority Secret Key:',
    Buffer.from(newMintAuthority.secretKey).toString('base64'),
  );

  const tokenMint = new PublicKey('3J5uJ5Pn8yrLwraQSmNMDYFAw59tf2mPTbMxBTtEFx3t');

  const transaction = new Transaction().add(
    createSetAuthorityInstruction(
      tokenMint,
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
