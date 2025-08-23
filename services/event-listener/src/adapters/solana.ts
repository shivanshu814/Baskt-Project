import { PROGRAM_ID, solanaConnection } from '../utils/const';
import { basktClient } from '../utils/config';
import type { ObserverRouter } from '../observer-router';
import { EventSource } from '../types';

console.log(
  '[solana-adapter] initialized and will emit events...',
  PROGRAM_ID,
  solanaConnection.rpcEndpoint,
);

export function initSolanaAdapter(router: ObserverRouter) {
  const eventMaps = router.sourceToEvents[EventSource.SOLANA];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Object.entries(eventMaps).forEach(([_, anchorEvent]) => {
    console.log(`[solana-adapter] Listening for event`, anchorEvent);
    basktClient.program.addEventListener(
      anchorEvent as any,
      (event: any, slot: number, signature: string) => {
        router.emit({
          source: EventSource.SOLANA,
          name: anchorEvent,
          payload: { event, slot, signature },
        }, signature); // Pass the transaction signature
      },
      'confirmed',
    );
  });

}

export const adapterName = EventSource.SOLANA;
