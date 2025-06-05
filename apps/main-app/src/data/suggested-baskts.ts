export interface SuggestedBaskt {
  id: string;
  name: string;
  price: number;
  change24h: number;
}

export const suggestedBaskts: SuggestedBaskt[] = [
  {
    id: '1',
    name: 'DeFi Blue Chips',
    price: 125.5,
    change24h: 3.2,
  },
  {
    id: '2',
    name: 'AI & Big Data',
    price: 98.75,
    change24h: -1.5,
  },
  {
    id: '3',
    name: 'Gaming & Metaverse',
    price: 87.25,
    change24h: 5.8,
  },
  {
    id: '4',
    name: 'Layer 1 Tokens',
    price: 156.8,
    change24h: 2.1,
  },
  {
    id: '5',
    name: 'NFT & Digital Art',
    price: 75.3,
    change24h: -2.3,
  },
];
