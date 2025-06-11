// import * as anchor from '@coral-xyz/anchor';
// import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
// import { AnchorProvider } from '@coral-xyz/anchor';
// import { TestClient } from '../../tests/utils/test-client';
// import { BN } from 'bn.js';
// import dotenv from 'dotenv';
// import readline from 'readline';

// dotenv.config();

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
//   const connection = new Connection(
//     process.env.ANCHOR_PROVIDER_URL || 'http://localhost:8899',
//     'confirmed',
//   );

//   const walletKeypair = Keypair.fromSecretKey(
//     Buffer.from(
//       JSON.parse(require('fs').readFileSync('/Users/shivanshu814/.config/solana/id.json', 'utf-8')),
//     ),
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
//     const signature = await connection.requestAirdrop(wallet.publicKey, LAMPORTS_PER_SOL * 50);
//     await connection.confirmTransaction(signature, 'confirmed');

//     const orders = await client.getAllOrders();
//     console.log('Available orders:');
//     orders.forEach((order, index) => {
//       console.log(
//         `${index + 1}. Order ID: ${order.orderId.toString()}, Basket: ${order.basktId.toString()}`,
//       );
//     });

//     const orderIndexInput = await askQuestion(
//       'Enter the number of the order you want to open a position for: ',
//     );
//     const orderIndex = parseInt(orderIndexInput) - 1;

//     if (isNaN(orderIndex) || orderIndex < 0 || orderIndex >= orders.length) {
//       throw new Error('Invalid order selection.');
//     }

//     const selectedOrder = orders[orderIndex];
//     const orderPDA = selectedOrder.address;
//     const basktId = selectedOrder.basktId;

//     const fundingIndex = await client.getFundingIndex(basktId);
//     if (!fundingIndex) {
//       await client.initializeFundingIndex(basktId);
//     }

//     const oraclePrice = new BN(1000000);
//     await client.updateOraclePrice(basktId, oraclePrice);

//     const positionId = new BN(Date.now() + 1);
//     const entryPrice = new BN(1000000);

//     const positionTx = await client.openPosition({
//       order: orderPDA,
//       positionId: positionId,
//       entryPrice: entryPrice,
//       baskt: basktId,
//     });

//     console.log('Position opened with transaction:', positionTx);
//     console.log('Position opening completed successfully!');
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
