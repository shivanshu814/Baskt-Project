import { Asset } from '../baskt';

export interface AssetRendererProps {
  asset: Asset;
}

export interface MultiAssetRendererProps {
  assets: Asset[];
  remainingCount: number;
}

export interface BasketAssetRendererProps {
  assets: Asset[];
}

export interface UseAssetRenderingReturn {
  displayAssets: Asset[];
  remainingCount: number;
  shouldRenderMulti: boolean;
}

export type RenderType = 'single' | 'multi';

export interface AssetData {
  displayAssets: Asset[];
  remainingCount: number;
  renderType: RenderType;
}
