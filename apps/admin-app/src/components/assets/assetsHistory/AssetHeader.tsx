import React from 'react';
import { Card } from '../../ui/card';
import { AssetHeaderProps } from '../../../types/assets';

export const AssetHeader: React.FC<AssetHeaderProps> = ({
  assetName,
  assetAddress,
  assetLogo,
  ticker,
}) => {
  return (
    <Card className="p-4 bg-[#010b1d] border-white/10">
      <div className="flex items-center gap-4">
        {assetLogo && (
          <img
            src={assetLogo}
            alt={assetName}
            className="w-12 h-12 rounded-full border border-white/10"
          />
        )}
        <div>
          <div className="font-bold text-lg text-white">
            {assetName} {ticker && <span className="text-sm text-[#E5E7EB]/60">({ticker})</span>}
          </div>
          <div className="text-xs text-[#E5E7EB]/60">
            Address: <span className="font-mono">{assetAddress}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
