'use client';
import { NumberFormat } from '@baskt/ui';
import Image from 'next/image';
import React from 'react';
import { AssetExposureRowProps } from '../../../types/vault';

const calculateExposurePercentages = (longExposure: number, shortExposure: number) => {
  const totalExposure = longExposure + shortExposure;
  if (totalExposure <= 0) return { longPercentage: '0', shortPercentage: '0' };

  return {
    longPercentage: ((longExposure / totalExposure) * 100).toFixed(2),
    shortPercentage: ((shortExposure / totalExposure) * 100).toFixed(2),
  };
};

export const AssetExposureRow = React.memo<AssetExposureRowProps>(({ asset }) => {
  const assetSymbol = asset.ticker || asset.name || 'Unknown';

  const getAssetImage = () => {
    if (asset.logo) return asset.logo;

    const ticker = asset.ticker?.toLowerCase();
    if (ticker) {
      return `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${ticker}.png`;
    }

    return 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/2give.png';
  };

  const assetImage = getAssetImage();
  const longExposure = asset.longExposure || 0;
  const shortExposure = asset.shortExposure || 0;
  const netExposure = longExposure - shortExposure;

  const { longPercentage, shortPercentage } = calculateExposurePercentages(
    longExposure,
    shortExposure,
  );

  return (
    <tr key={assetSymbol}>
      <td className="px-4 py-3 flex items-center gap-3">
        <Image
          src={assetImage}
          alt={assetSymbol}
          className="w-7 h-7 rounded-full"
          width={28}
          height={28}
        />
        <div>
          <div className="font-semibold text-foreground">{assetSymbol}</div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="font-semibold text-foreground">
          <NumberFormat value={longExposure} isPrice={true} showCurrency={true} />
        </div>
        <div className="text-xs text-muted-foreground">{longPercentage}%</div>
      </td>
      <td className="px-4 py-3">
        <div className="font-semibold text-foreground">
          <NumberFormat value={shortExposure} isPrice={true} showCurrency={true} />
        </div>
        <div className="text-xs text-muted-foreground">{shortPercentage}%</div>
      </td>
      <td className="px-4 py-3">
        <div className="font-semibold text-foreground">
          <NumberFormat value={Math.abs(netExposure)} isPrice={true} showCurrency={true} />
        </div>
        <div className="text-xs text-muted-foreground">{netExposure >= 0 ? 'Long' : 'Short'}</div>
      </td>
    </tr>
  );
});

AssetExposureRow.displayName = 'AssetExposureRow';
