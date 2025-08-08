import Image from 'next/image';
import { MultiAssetRendererProps } from '../../../../types/asset/rendering';
import { handleImageError, isValidImageUrl } from '../../../../utils/asset/asset';

export const MultiAssetRenderer = ({
  assets,
  remainingCount,
}: MultiAssetRendererProps): JSX.Element => {
  return (
    <div className="flex items-center justify-center">
      {assets.map((asset, index) => (
        <div
          key={asset.ticker || asset.name || index}
          className="w-6 h-6 rounded-full bg-muted/30 flex items-center justify-center border border-border/20 overflow-hidden"
          style={{ marginLeft: index > 0 ? '-12px' : '0' }}
          title={asset.ticker || asset.name}
        >
          {isValidImageUrl(asset.logo) ? (
            <Image
              src={asset.logo || ''}
              alt={asset.ticker || asset.name || 'Asset'}
              width={24}
              height={24}
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
          ) : null}
        </div>
      ))}
      {remainingCount > 0 && (
        <span className="text-[10px] text-muted-foreground font-medium ml-1">
          +{remainingCount}
        </span>
      )}
    </div>
  );
};
