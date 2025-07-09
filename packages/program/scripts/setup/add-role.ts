import dotenv from 'dotenv';
dotenv.config();

import { getOrCreateAssociatedTokenAccount, createMint } from '@solana/spl-token';
import { getProvider } from '../utils';
import { Keypair, PublicKey } from '@solana/web3.js';
import { TestClient } from '../../tests/utils/test-client';
import { AccessControlRole } from '@baskt/types';

async function main() {
  const { program, wallet, provider } = getProvider(
    'https://attentive-long-replica.solana-mainnet.quiknode.pro/5338b0732eff649c847a73b9132b485b8e9d7346/',
  );
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
    new PublicKey('BCCYwetDkCARUoMYUW71uAsCxcLgiJZn2yD3fqhLMejg'),
    AccessControlRole.Owner,
  );  



}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
