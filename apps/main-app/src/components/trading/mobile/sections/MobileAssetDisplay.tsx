import { MobileAssetDisplayProps } from '../../../../types/trading/components/mobile';
import { getAssetDisplayInfo } from '../../../../utils/asset/asset';
import { AssetLogo } from '../../../create-baskt/assetModal/AssetLogo';

export function MobileAssetDisplay({ assets }: MobileAssetDisplayProps) {
  const { visibleAssets, extraCount, hasExtraAssets } = getAssetDisplayInfo(assets);

  return (
    <div className="flex -space-x-1">
      {visibleAssets.map((asset, index) => (
        <div
          key={index}
          className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center"
        >
          <AssetLogo
            ticker={asset.ticker || asset.name || 'Asset'}
            logo={asset.logo || ''}
            size={'sm'}
          />
        </div>
      ))}
      {hasExtraAssets && (
        <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
          <span className={`text-[8px] font-bold text-white`}>+{extraCount}</span>
        </div>
      )}
    </div>
  );
}
