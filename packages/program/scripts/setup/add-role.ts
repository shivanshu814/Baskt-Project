import dotenv from 'dotenv';
dotenv.config();

import { getOrCreateAssociatedTokenAccount, createMint } from '@solana/spl-token';
import { getProvider } from '../utils';
import { Keypair, PublicKey } from '@solana/web3.js';
import { TestClient } from '../../tests/utils/test-client';
import { AccessControlRole } from '@baskt/types';

async function main() {
  const { program, wallet, provider } = getProvider(
    'https://fabled-indulgent-seed.solana-devnet.quiknode.pro/19abbec85e908d5bdf453cc6bf35fb6d8d559b80/',
  );

  const key = Buffer.from([55,54,106,37,182,58,147,242,86,67,192,220,81,26,36,168,135,149,82,114,80,66,145,237,82,133,177,145,165,187,79,71,198,28,244,21,31,57,38,65,178,4,160,31,253,212,200,30,66,5,120,67,158,100,184,67,243,103,125,187,165,72,126,135]);
  const keypair = Keypair.fromSecretKey(key);
  console.log(keypair.publicKey.toBase58());

  const client = new TestClient(program);
  client.setPublicKey(wallet.publicKey);


//   const role = await client.addRole(    
//     new PublicKey('BCCYwetDkCARUoMYUW71uAsCxcLgiJZn2yD3fqhLMejg'),
//     AccessControlRole.Rebalancer,
//   );

//   const role4 = await client.addRole(    
//     new PublicKey('BCCYwetDkCARUoMYUW71uAsCxcLgiJZn2yD3fqhLMejg'),
//     AccessControlRole.FundingManager,
//   );

//   const role5 = await client.addRole(    
//     new PublicKey('BCCYwetDkCARUoMYUW71uAsCxcLgiJZn2yD3fqhLMejg'),
//     AccessControlRole.Liquidator,
//   );

//   const role6 = await client.addRole(    
//     new PublicKey('BCCYwetDkCARUoMYUW71uAsCxcLgiJZn2yD3fqhLMejg'),
//     AccessControlRole.Matcher,
//   );


//   const role7 = await client.addRole(    
//     new PublicKey('BCCYwetDkCARUoMYUW71uAsCxcLgiJZn2yD3fqhLMejg'),
//     AccessControlRole.OracleManager,
//   );

  const role8 = await client.addRole(    
    new PublicKey(keypair.publicKey.toBase58()),
    AccessControlRole.Owner,
  );  



}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
