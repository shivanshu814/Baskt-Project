// import * as anchor from '@coral-xyz/anchor';
// import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
// import { AnchorProvider } from '@coral-xyz/anchor';
// import { TestClient } from '../../tests/utils/test-client';
// import { BN } from 'bn.js';
// import dotenv from 'dotenv';
// import readline from 'readline';
// import {
//   getAssociatedTokenAddressSync,
//   createAssociatedTokenAccountInstruction,
// } from '@solana/spl-token';

// dotenv.config();

// const RPC_URL = process.env.ANCHOR_PROVIDER_URL || 'http://localhost:8899';

// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout,
// });

// async function askQuestion(query: string): Promise<string> {
//   return new Promise((resolve) => {
//     rl.question(query, (answer) => {
//       resolve(answer);
//     });
//   });
// }

// async function main() {
//   const connection = new Connection(RPC_URL, 'confirmed');

//   const walletKeypair = Keypair.fromSecretKey(
//     Buffer.from(JSON.parse(require('fs').readFileSync(process.env.ANCHOR_WALLET || '', 'utf-8'))),
//   );
//   const wallet = new anchor.Wallet(walletKeypair);

//   const provider = new AnchorProvider(connection, wallet, {
//     commitment: 'confirmed',
//   });

//   anchor.setProvider(provider);

//   const program = anchor.workspace.BasktV1;

//   const client = new TestClient(program);
//   client.setPublicKey(wallet.publicKey);

//   try {
//     console.log('Requesting airdrop for wallet:', wallet.publicKey.toString());
//     const signature = await connection.requestAirdrop(wallet.publicKey, LAMPORTS_PER_SOL * 50);
//     await connection.confirmTransaction(signature, 'confirmed');
//     console.log('Airdrop successful');

//     const protocolAccount = await client.getProtocolAccount();
//     if (!protocolAccount) {
//       throw new Error('Protocol not found. Please run init:protocol first.');
//     }
//     console.log('Got protocol account');

//     const baskets = await client.getAllBaskts();
//     console.log('Available baskets:');
//     baskets.forEach((basket, index) => {
//       console.log(`${index + 1}. ${basket.publicKey.toString()}`);
//     });

//     const basketIndexInput = await askQuestion(
//       'Enter the number of the basket you want to create an order for: ',
//     );
//     const basketIndex = parseInt(basketIndexInput) - 1;

//     if (isNaN(basketIndex) || basketIndex < 0 || basketIndex >= baskets.length) {
//       throw new Error('Invalid basket selection.');
//     }

//     const selectedBasket = baskets[basketIndex];
//     const basktId = selectedBasket.publicKey;

//     const ownerTokenAccount = getAssociatedTokenAddressSync(
//       protocolAccount.escrowMint,
//       wallet.publicKey,
//     );

//     try {
//       const createAtaIx = createAssociatedTokenAccountInstruction(
//         wallet.publicKey,
//         ownerTokenAccount,
//         wallet.publicKey,
//         protocolAccount.escrowMint,
//       );

//       const tx = new anchor.web3.Transaction().add(createAtaIx);
//       await provider.sendAndConfirm(tx);
//     } catch (error) {
//       console.log('Token account might already exist, continuing...');
//     }

//     console.log('Creating order for baskt:', basktId.toString());
//     const orderId = new BN(Date.now());
//     const size = new BN(1000000);
//     const collateral = new BN(10000000);
//     const isLong = true;
//     const action = { open: {} };
//     const targetPosition = null;

//     await client.mintUSDC(ownerTokenAccount, collateral.muln(2).toNumber());

//     const orderTx = await client.createOrderTx(
//       orderId,
//       size,
//       collateral,
//       isLong,
//       action,
//       targetPosition,
//       basktId,
//       ownerTokenAccount,
//       protocolAccount.escrowMint,
//     );

//     console.log('Order created with transaction:', orderTx);

//     // Initialize funding index for the basket
//     await client.initializeFundingIndex(basktId);
//     console.log('Order creation completed successfully!');
//   } catch (error) {
//     console.error('Error:', error);
//   } finally {
//     rl.close();
//   }
// }

// main().then(
//   () => process.exit(0),
//   (err) => {
//     console.error(err);
//     process.exit(1);
//   },
// );
