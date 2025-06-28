import { PublicKey } from "@solana/web3.js";
import { client } from "./client";
import { BN } from "bn.js";
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../services/backend/src/router';

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:4000/trpc',
    }),
  ],
});

export async function getCurrentNavForBaskt(basktId: PublicKey) {
    const baskt = await trpc.baskt.getBasktNAV.query({
      basktId: basktId.toString(),
    });
  
    if (!baskt.success) {
      const errorMessage =
        'error' in baskt ? baskt.error : 'message' in baskt ? baskt.message : 'Unknown error';
      console.error('Failed to fetch baskt metadata:', errorMessage);
      throw new Error('Failed to fetch baskt metadata');
    }
  
    if (!('data' in baskt)) {
      console.error('Baskt metadata not found for baskt:', basktId.toString());
      throw new Error('Baskt metadata not found');
    }
  
    const nav = baskt.data.nav === 0 ? 1000000 : baskt.data.nav;
    return new BN(nav);
  }