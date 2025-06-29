import dotenv from 'dotenv';
dotenv.config();

import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair } from '@solana/web3.js';
import { join } from 'path';
import { homedir } from 'os';
import { Baskt } from '../../target/types/baskt';
import BasktIdl from '../../target/idl/baskt.json';

export const getProvider = (endpointParam?: string) => {
  const endpoint = endpointParam || process.env.ANCHOR_PROVIDER_URL!;
  const connection = new Connection(endpoint, 'confirmed');
  const walletPath = process.env.ANCHOR_WALLET || join(homedir(), '.config', 'solana', 'id.json');
  const walletKeypair = require(walletPath);
  const wallet = new anchor.Wallet(Keypair.fromSecretKey(new Uint8Array(walletKeypair)));
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
    preflightCommitment: 'confirmed',
  });
  const program = new anchor.Program<Baskt>(BasktIdl, provider);
  return { provider, program, wallet };
};
