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
}

export const poolAllocations: PoolAllocation[] = [
  {
    symbol: 'ADA',
    name: 'Cardano',
    image: 'https://assets.coingecko.com/coins/images/975/standard/cardano.png',
    poolSize: {
      usd: '100,000,000.00',
      amount: '150,000,000 ADA',
    },
    weightage: {
      current: '20.00',
      target: '20',
    },
    utilization: '10.00%',
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    image: 'https://assets.coingecko.com/coins/images/4128/standard/solana.png',
    poolSize: {
      usd: '200,000,000.00',
      amount: '4,000,000 SOL',
    },
    weightage: {
      current: '25.00',
      target: '25',
    },
    utilization: '15.00%',
  },
  {
    symbol: 'DOGE',
    name: 'Dogecoin',
    image: 'https://assets.coingecko.com/coins/images/5/standard/dogecoin.png',
    poolSize: {
      usd: '50,000,000.00',
      amount: '700,000,000 DOGE',
    },
    weightage: {
      current: '10.00',
      target: '10',
    },
    utilization: '5.00%',
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    image: 'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
    poolSize: {
      usd: '300,000,000.00',
      amount: '100,000 ETH',
    },
    weightage: {
      current: '30.00',
      target: '30',
    },
    utilization: '20.00%',
  },
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    image: 'https://assets.coingecko.com/coins/images/1/standard/bitcoin.png',
    poolSize: {
      usd: '400,000,000.00',
      amount: '10,000 BTC',
    },
    weightage: {
      current: '15.00',
      target: '15',
    },
    utilization: '50.00%',
  },
];
