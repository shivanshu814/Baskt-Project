export interface Asset {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  position: 'long' | 'short';
  weightage: number; // percentage in the Baskt
  allocation?: number; // calculated based on user's position size
}

export interface Baskt {
  id: string;
  name: string;
  description: string;
  totalAssets: number;
  aum: number; // Assets Under Management
  price: number;
  change24h: number;
  creator: string;
  creationDate: string;
  category: string;
  performance: {
    day: number;
    week: number;
    month: number;
    year: number;
  };
  risk: 'low' | 'medium' | 'high';
  assets: Asset[];
  sparkline: number[];
}

export interface UserBasktPosition {
  basktId: string;
  positionSize: number; // in USD
  entryPrice: number;
  currentValue: number;
  pnl: number; // profit/loss
  pnlPercentage: number;
  openDate: string;
  type?: 'long' | 'short'; // Added property for position type
  collateral?: number; // Added property for collateral amount
}

// Example Baskts
export const popularBaskts: Baskt[] = [
  {
    id: 'defi-pulse',
    name: 'DeFi Pulse',
    description: 'A basket of the top DeFi protocols weighted by market cap',
    totalAssets: 5,
    aum: 24500000,
    price: 148.32,
    change24h: 4.56,
    creator: 'Baskt Finance',
    creationDate: '2023-01-15',
    category: 'DeFi',
    performance: {
      day: 4.56,
      week: 12.34,
      month: 23.45,
      year: 112.34,
    },
    risk: 'high',
    assets: [
      {
        id: 'uniswap',
        name: 'Uniswap',
        symbol: 'UNI',
        price: 5.42,
        change24h: 5.2,
        position: 'long',
        weightage: 30,
      },
      {
        id: 'aave',
        name: 'Aave',
        symbol: 'AAVE',
        price: 68.75,
        change24h: 3.7,
        position: 'long',
        weightage: 25,
      },
      {
        id: 'maker',
        name: 'MakerDAO',
        symbol: 'MKR',
        price: 1256.83,
        change24h: 2.1,
        position: 'long',
        weightage: 20,
      },
      {
        id: 'compound',
        name: 'Compound',
        symbol: 'COMP',
        price: 42.16,
        change24h: -1.5,
        position: 'long',
        weightage: 15,
      },
      {
        id: 'sushiswap',
        name: 'SushiSwap',
        symbol: 'SUSHI',
        price: 1.03,
        change24h: -2.8,
        position: 'short',
        weightage: 10,
      },
    ],
    sparkline: [140, 142, 145, 143, 146, 148, 147, 149, 148, 150],
  },
  {
    id: 'metaverse-index',
    name: 'Metaverse Index',
    description: 'Exposure to top metaverse and gaming tokens',
    totalAssets: 4,
    aum: 18700000,
    price: 89.74,
    change24h: -2.32,
    creator: 'Crypto Indices',
    creationDate: '2023-03-21',
    category: 'Metaverse',
    performance: {
      day: -2.32,
      week: 5.43,
      month: -8.76,
      year: 43.21,
    },
    risk: 'high',
    assets: [
      {
        id: 'sandbox',
        name: 'The Sandbox',
        symbol: 'SAND',
        price: 0.43,
        change24h: -3.2,
        position: 'long',
        weightage: 35,
      },
      {
        id: 'decentraland',
        name: 'Decentraland',
        symbol: 'MANA',
        price: 0.39,
        change24h: -1.8,
        position: 'long',
        weightage: 30,
      },
      {
        id: 'axie',
        name: 'Axie Infinity',
        symbol: 'AXS',
        price: 5.84,
        change24h: -4.7,
        position: 'short',
        weightage: 20,
      },
      {
        id: 'enjin',
        name: 'Enjin Coin',
        symbol: 'ENJ',
        price: 0.29,
        change24h: -2.5,
        position: 'long',
        weightage: 15,
      },
    ],
    sparkline: [92, 91, 90, 89, 88, 87, 88, 89, 90, 89],
  },
  {
    id: 'blue-chip-crypto',
    name: 'Blue Chip Crypto',
    description: 'Major cryptocurrencies with established track records',
    totalAssets: 5,
    aum: 132500000,
    price: 235.67,
    change24h: 1.89,
    creator: 'Baskt Finance',
    creationDate: '2022-11-05',
    category: 'Large Cap',
    performance: {
      day: 1.89,
      week: 7.65,
      month: 15.43,
      year: 87.54,
    },
    risk: 'medium',
    assets: [
      {
        id: 'bitcoin',
        name: 'Bitcoin',
        symbol: 'BTC',
        price: 51283.42,
        change24h: 2.34,
        position: 'long',
        weightage: 40,
      },
      {
        id: 'ethereum',
        name: 'Ethereum',
        symbol: 'ETH',
        price: 2486.73,
        change24h: 3.12,
        position: 'long',
        weightage: 30,
      },
      {
        id: 'binancecoin',
        name: 'Binance Coin',
        symbol: 'BNB',
        price: 598.24,
        change24h: -1.23,
        position: 'short',
        weightage: 10,
      },
      {
        id: 'solana',
        name: 'Solana',
        symbol: 'SOL',
        price: 148.32,
        change24h: 4.56,
        position: 'long',
        weightage: 10,
      },
      {
        id: 'cardano',
        name: 'Cardano',
        symbol: 'ADA',
        price: 0.4235,
        change24h: -0.87,
        position: 'long',
        weightage: 10,
      },
    ],
    sparkline: [230, 232, 235, 234, 236, 235, 237, 236, 234, 235],
  },
  {
    id: 'ai-crypto-index',
    name: 'AI Crypto Index',
    description: 'Basket of tokens focusing on artificial intelligence',
    totalAssets: 4,
    aum: 8900000,
    price: 64.21,
    change24h: 7.83,
    creator: 'Crypto Indices',
    creationDate: '2023-05-10',
    category: 'Technology',
    performance: {
      day: 7.83,
      week: 18.92,
      month: 42.35,
      year: 0,
    },
    risk: 'high',
    assets: [
      {
        id: 'fetch',
        name: 'Fetch.ai',
        symbol: 'FET',
        price: 0.78,
        change24h: 12.5,
        position: 'long',
        weightage: 35,
      },
      {
        id: 'ocean',
        name: 'Ocean Protocol',
        symbol: 'OCEAN',
        price: 0.42,
        change24h: 8.7,
        position: 'long',
        weightage: 30,
      },
      {
        id: 'singularity',
        name: 'SingularityNET',
        symbol: 'AGIX',
        price: 0.35,
        change24h: 15.3,
        position: 'long',
        weightage: 25,
      },
      {
        id: 'numeraire',
        name: 'Numeraire',
        symbol: 'NMR',
        price: 15.67,
        change24h: -2.4,
        position: 'short',
        weightage: 10,
      },
    ],
    sparkline: [58, 59, 60, 61, 62, 63, 65, 67, 68, 64],
  },
];

// User's current baskt positions
export const userBasktPositions: UserBasktPosition[] = [
  {
    basktId: 'defi-pulse',
    positionSize: 5000,
    entryPrice: 140.25,
    currentValue: 5287.42,
    pnl: 287.42,
    pnlPercentage: 5.75,
    openDate: '2023-10-15',
    type: 'long',
    collateral: 7500, // 150% of position size
  },
  {
    basktId: 'blue-chip-crypto',
    positionSize: 10000,
    entryPrice: 220.32,
    currentValue: 10695.87,
    pnl: 695.87,
    pnlPercentage: 6.96,
    openDate: '2023-09-28',
    type: 'long',
    collateral: 15000, // 150% of position size
  },
];

// Helper function to get a Baskt by ID
export function getBasktById(id: string): Baskt | undefined {
  return popularBaskts.find((baskt) => baskt.id === id);
}

// Helper function to get user position for a specific Baskt
export function getUserPositionForBaskt(basktId: string): UserBasktPosition | undefined {
  return userBasktPositions.find((position) => position.basktId === basktId);
}

// Calculate the total value of user's Baskt positions
export function calculateTotalPortfolioValue(): number {
  return userBasktPositions.reduce((total, position) => total + position.currentValue, 0);
}

// Calculate total profit/loss
export function calculateTotalPnL(): number {
  return userBasktPositions.reduce((total, position) => total + position.pnl, 0);
}

// Calculate total profit/loss percentage
export function calculateTotalPnLPercentage(): number {
  const totalValue = calculateTotalPortfolioValue();
  const totalInitialValue = userBasktPositions.reduce(
    (total, position) => total + position.positionSize,
    0,
  );

  if (totalInitialValue === 0) return 0;
  return ((totalValue - totalInitialValue) / totalInitialValue) * 100;
}
