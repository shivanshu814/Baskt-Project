import dotenv from 'dotenv';
dotenv.config();

import { getOrCreateAssociatedTokenAccount, createMint } from '@solana/spl-token';
import { getProvider } from '../utils';
import { Keypair, PublicKey } from '@solana/web3.js';
import { TestClient } from '../../tests/utils/test-client';
import { AccessControlRole } from '@baskt/types';

async function main() {
const key = [107,189,10,253,79,142,230,180,48,191,93,83,8,228,78,168,60,180,86,128,127,237,29,65,76,12,58,77,74,60,24,106,151,115,81,144,184,228,147,55,90,216,93,189,78,68,58,142,20,31,142,61,74,185,182,194,248,16,9,131,125,132,193,47];
const keypair = Keypair.fromSecretKey(Uint8Array.from(key));
console.log(keypair.publicKey.toBase58());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
