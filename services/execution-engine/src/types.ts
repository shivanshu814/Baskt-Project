export interface ExecutionConfig {
  redis: {
    url: string;
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