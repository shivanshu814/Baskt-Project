export const config = {
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },
  dataBus: {
    signingKey: process.env.DATABUS_SIGNING_KEY || 'dev-signing-key'
  },
  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL || 'http://localhost:8899',
    walletPath: process.env.ANCHOR_WALLET
  },
  service: {
    port: parseInt(process.env.PORT || '3007', 10),
    instanceId: process.env.INSTANCE_ID || '1',
    concurrency: parseInt(process.env.EXECUTION_CONCURRENCY || '10', 10)
  }
};

export * from './client';
export * from './queue';