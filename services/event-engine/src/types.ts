export enum EventSource {
  SOLANA = 'solana',
  MONGO = 'mongo',
  POSTGRES = 'postgres',
}

export type ObserverEvent = { source: EventSource; name: string; payload: any };

export type Handler = (event: ObserverEvent) => unknown | Promise<unknown>;
