export interface AssetPrice {
  priceUSD: string;
  assetId: string;
  timestamp: number;
}

export interface AssetPriceDBValue {
  assetId: string;
  price: string;
  time: number;
}
