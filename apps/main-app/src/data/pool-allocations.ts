export interface PoolAllocation {
  symbol: string;
  name: string;
  image: string;
  poolSize: {
    usd: string;
    amount: string;
  };
  weightage: {
    current: string;
    target: string;
  };
  utilization: string;
  longExposure: {
    usd: string;
    percentage: string;
  };
  shortExposure: {
    usd: string;
    percentage: string;
  };
}

export const poolAllocations: PoolAllocation[] = [
  {
    symbol: 'ADA',
    name: 'Cardano',
    image: 'https://assets.coingecko.com/coins/images/975/standard/cardano.png',
    poolSize: {
      usd: '100,000',
      amount: '150,000,000',
    },
    weightage: {
      current: '20.00',
      target: '20',
    },
    utilization: '10.00%',
    longExposure: {
      usd: '85,000',
      percentage: '17.00',
    },
    shortExposure: {
      usd: '15,000',
      percentage: '3.00',
    },
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    image: 'https://assets.coingecko.com/coins/images/4128/standard/solana.png',
    poolSize: {
      usd: '200,000',
      amount: '4,000,000',
    },
    weightage: {
      current: '25.00',
      target: '25',
    },
    utilization: '15.00%',
    longExposure: {
      usd: '120,000',
      percentage: '24.00',
    },
    shortExposure: {
      usd: '80,000',
      percentage: '16.00',
    },
  },
  {
    symbol: 'DOGE',
    name: 'Dogecoin',
    image: 'https://assets.coingecko.com/coins/images/5/standard/dogecoin.png',
    poolSize: {
      usd: '50,000',
      amount: '700,000,000',
    },
    weightage: {
      current: '10.00',
      target: '10',
    },
    utilization: '5.00%',
    longExposure: {
      usd: '35,000',
      percentage: '7.00',
    },
    shortExposure: {
      usd: '15,000',
      percentage: '3.00',
    },
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    image: 'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
    poolSize: {
      usd: '300,000',
      amount: '100,000 ETH',
    },
    weightage: {
      current: '30.00',
      target: '30',
    },
    utilization: '20.00%',
    longExposure: {
      usd: '180,000',
      percentage: '36.00',
    },
    shortExposure: {
      usd: '120,000',
      percentage: '24.00',
    },
  },
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    image: 'https://assets.coingecko.com/coins/images/1/standard/bitcoin.png',
    poolSize: {
      usd: '400,000',
      amount: '10,000 BTC',
    },
    weightage: {
      current: '15.00',
      target: '15',
    },
    utilization: '50.00%',
    longExposure: {
      usd: '250,000',
      percentage: '50.00',
    },
    shortExposure: {
      usd: '150,000',
      percentage: '30.00',
    },
  },
];
