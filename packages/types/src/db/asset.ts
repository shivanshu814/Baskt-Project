export interface AssetPriceProviderConfig {
    provider: {
      id: string;
      chain: string;
      name: string;
    };
    twp: {
      seconds: number;
    };
    updateFrequencySeconds: number;
    units: number;
} 

