// import * as anchor from '@coral-xyz/anchor';
// import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram } from '@solana/web3.js';
// import { AnchorProvider } from '@coral-xyz/anchor';
// import { TestClient } from '../../tests/utils/test-client';
// import { BN } from 'bn.js';
// import dotenv from 'dotenv';
// import {
//   getAssociatedTokenAddress,
//   createAssociatedTokenAccountInstruction,
//   TOKEN_PROGRAM_ID,
// } from '@solana/spl-token';

// dotenv.config();

// const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

// async function main() {
//   const connection = new Connection(
//     process.env.ANCHOR_PROVIDER_URL || 'http://localhost:8899',
//     'confirmed',
//   );

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
//     const signature = await connection.requestAirdrop(wallet.publicKey, LAMPORTS_PER_SOL * 50);
//     await connection.confirmTransaction(signature, 'confirmed');

//     const [registry] = PublicKey.findProgramAddressSync(
//       [Buffer.from('registry')],
//       program.programId,
//     );

//     const [protocolPDA] = PublicKey.findProgramAddressSync(
//       [Buffer.from('protocol')],
//       program.programId,
//     );

//     let isProtocolInitialized = false;
//     try {
//       const protocolAccount = await program.account.protocol.fetch(protocolPDA);
//       isProtocolInitialized = protocolAccount.isInitialized;
//       console.log('Protocol is already initialized');
//     } catch (error) {
//       console.log('Protocol is not initialized yet');
//     }

//     let existingRegistry = null;
//     try {
//       existingRegistry = await program.account.protocolRegistry.fetch(registry);
//     } catch (error) {
//       console.log('Protocol registry is not initialized yet');
//     }

//     if (!existingRegistry) {
//       console.log('Initializing protocol registry...');

//       const liquidityPool = await client.findLiquidityPoolPDA();

//       let isLiquidityPoolInitialized = false;
//       try {
//         await program.account.liquidityPool.fetch(liquidityPool);
//         isLiquidityPoolInitialized = true;
//         console.log('Liquidity pool is already initialized');
//       } catch (error) {
//         console.log('Liquidity pool is not initialized yet');
//       }

//       const [poolAuthority] = PublicKey.findProgramAddressSync(
//         [Buffer.from('pool_authority'), liquidityPool.toBuffer(), protocolPDA.toBuffer()],
//         program.programId,
//       );

//       const [programAuthority] = PublicKey.findProgramAddressSync(
//         [Buffer.from('authority')],
//         program.programId,
//       );

//       const escrowMint = USDC_MINT;

//       const lpMintKeypair = Keypair.generate();
//       const lpMint = lpMintKeypair.publicKey;

//       const treasuryKeypair = Keypair.generate();

//       const treasurySignature = await connection.requestAirdrop(
//         treasuryKeypair.publicKey,
//         LAMPORTS_PER_SOL * 2,
//       );
//       await connection.confirmTransaction(treasurySignature, 'confirmed');

//       const treasuryTokenAccount = await getAssociatedTokenAddress(
//         escrowMint,
//         treasuryKeypair.publicKey,
//       );

//       try {
//         const createAtaIx = createAssociatedTokenAccountInstruction(
//           wallet.publicKey,
//           treasuryTokenAccount,
//           treasuryKeypair.publicKey,
//           escrowMint,
//         );

//         const tx = new anchor.web3.Transaction().add(createAtaIx);
//         await provider.sendAndConfirm(tx);
//       } catch (error) {
//         console.log('Treasury token account might already exist:', treasuryTokenAccount.toString());
//       }

//       if (!isProtocolInitialized) {
//         console.log('Initializing protocol...');
//         await program.methods
//           .initializeProtocol(treasuryKeypair.publicKey)
//           .accounts({
//             authority: wallet.publicKey,
//             programAuthority: programAuthority,
//             escrowMint: escrowMint,
//             systemProgram: SystemProgram.programId,
//           })
//           .rpc();
//         console.log('Protocol initialized successfully');
//       }

//       await program.methods
//         .addRole({ treasury: {} })
//         .accounts({
//           owner: wallet.publicKey,
//           account: treasuryKeypair.publicKey,
//         })
//         .rpc();

//       if (!isLiquidityPoolInitialized) {
//         console.log('Initializing liquidity pool...');
//         await client.initializeLiquidityPool(
//           50,
//           50,
//           new BN(1000000),
//           lpMint,
//           escrowMint,
//           lpMintKeypair,
//         );
//         console.log('Liquidity pool initialized successfully');
//       }

//       const [tokenVault] = PublicKey.findProgramAddressSync(
//         [Buffer.from('token_vault'), liquidityPool.toBuffer()],
//         program.programId,
//       );

//       const liquidityPoolAccount = await program.account.liquidityPool.fetch(liquidityPool);
//       if (liquidityPoolAccount.tokenVault.toString() !== tokenVault.toString()) {
//         throw new Error('Token vault mismatch between liquidity pool and PDA');
//       }

//       console.log(
//         'Protocol and liquidity pool are initialized. No registry initialization needed.',
//       );
//     }

//     console.log('\nYou can now proceed with:');
//     console.log('1. pnpm create:baskt - to create a new basket');
//     console.log('2. pnpm activate:baskt - to activate the basket');
//     console.log('3. pnpm create:order - to create an order');
//     console.log('4. pnpm open:position - to open a position');
//   } catch (error) {
//     console.error('Error:', error);
//   }
// }

// main().then(
//   () => process.exit(0),
//   (err) => {
//     console.error(err);
//     process.exit(1);
//   },
// );
