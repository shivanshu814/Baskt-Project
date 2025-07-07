import { getProvider } from '../utils';
import { Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { createSetAuthorityInstruction, AuthorityType, getMint } from '@solana/spl-token';

async function main() {
  const { wallet, provider } = getProvider(
    'https://attentive-long-replica.solana-mainnet.quiknode.pro/5338b0732eff649c847a73b9132b485b8e9d7346/',
  );

  const tokenKeypair = Keypair.fromSecretKey(
    Uint8Array.from([83,88,254,63,240,16,13,204,29,152,31,232,140,239,158,38,165,95,97,101,115,204,155,70,249,146,84,219,180,37,213,223,87,168,160,248,73,209,136,92,207,227,160,183,163,162,113,172,52,60,61,48,151,1,62,239,128,61,49,236,22,104,53,39]),
  );

  console.log(tokenKeypair.publicKey.toBase58());

  const mintAccount = await getMint(
    provider.connection,
    new PublicKey('6uBc97h6XMKY4kqQ3DJA9R8y9AXC7yUMsm7AUxM8QKpr'),
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

  const tokenMint = new PublicKey('6uBc97h6XMKY4kqQ3DJA9R8y9AXC7yUMsm7AUxM8QKpr');

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
