import { useAssetRendering } from '../../../../hooks/shared/use-asset-rendering';
import { BasketAssetRendererProps } from '../../../../types/asset/rendering';
import { MultiAssetRenderer } from './MultiAssetRenderer';
import { SingleAssetRenderer } from './SingleAssetRenderer';

export const BasketAssetRenderer = ({ assets }: BasketAssetRendererProps): JSX.Element => {
  // eslint-disable-next-line
  const { displayAssets, remainingCount, shouldRenderMulti } = useAssetRendering(assets as any);

  if (shouldRenderMulti) {
    return <MultiAssetRenderer assets={displayAssets} remainingCount={remainingCount} />;
  }
  // eslint-disable-next-line
  return <SingleAssetRenderer asset={displayAssets[0] as any} />;
};
