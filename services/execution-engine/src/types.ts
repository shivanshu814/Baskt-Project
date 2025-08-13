export interface ExecutionConfig {
  redis: {
    url: string;
  };
  dataBus: {
    signingKey: string;
  };
  solana: {
    rpcUrl: string;
    walletPath?: string;
  };
  service: {
    port: number;
    instanceId: string;
    concurrency: number;
  };
}