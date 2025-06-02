import { getProvider } from '../utils';
import { Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { createSetAuthorityInstruction, AuthorityType, getMint } from '@solana/spl-token';

async function main() {
  const { wallet, provider } = getProvider(
    'https://fabled-indulgent-seed.solana-devnet.quiknode.pro/19abbec85e908d5bdf453cc6bf35fb6d8d559b80/',
  );

  const tokenKeypair = Keypair.fromSecretKey(
    Uint8Array.from([
      95, 136, 61, 33, 143, 184, 249, 132, 146, 238, 145, 126, 84, 151, 150, 3, 198, 128, 238, 71,
      208, 173, 133, 110, 242, 194, 113, 215, 60, 111, 136, 193, 232, 32, 30, 249, 61, 182, 166,
      193, 104, 47, 98, 7, 122, 139, 156, 217, 163, 153, 134, 12, 116, 138, 148, 178, 168, 221, 240,
      43, 37, 101, 13, 5,
    ]),
  );

  const mintAccount = await getMint(
    provider.connection,
    new PublicKey('Gd7zeJamJavAPEywyEtPq28aaRdEMEKvDZwL7P8K2mWU'),
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

  const tokenMint = new PublicKey('Gd7zeJamJavAPEywyEtPq28aaRdEMEKvDZwL7P8K2mWU');

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
