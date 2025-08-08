import Image from 'next/image';
import { Asset } from '../../../../types/asset';
import {
  getAssetDisplayName,
  handleImageError,
  isValidImageUrl,
} from '../../../../utils/asset/asset';

export const SingleAssetRenderer = ({ asset }: { asset: Asset }): JSX.Element => {
  return (
    <div className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center border border-border/20 overflow-hidden">
      {isValidImageUrl(asset.logo) ? (
        <Image
          src={asset.logo || ''}
          alt={asset.ticker || asset.name || 'Asset'}
          width={32}
          height={32}
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
      ) : null}
      <span className="text-xs font-bold text-muted-foreground">{getAssetDisplayName(asset)}</span>
    </div>
  );
};
