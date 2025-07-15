export interface AssetPrice {
  priceUSD: string;
  assetId: string;
  timestamp: number;
  assetAddress: string;
}

export interface AssetPriceDBValue {
  assetId: string;
  price: string;
  time: number;
}
