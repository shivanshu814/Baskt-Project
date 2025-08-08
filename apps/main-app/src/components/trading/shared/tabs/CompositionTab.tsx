'use client';

import { NumberFormat } from '@baskt/ui';
import { CompositionTabProps } from '../../../../types/trading/components/tabs';
import {
  calculateAssetCompositionData,
  formatChangePercentage,
  getChangeColor,
  getDirectionColor,
  getDirectionText,
} from '../../../../utils/formatters/formatters';
import { AssetLogo } from '../../../create-baskt/assetModal/AssetLogo';

export function CompositionTab({ baskt }: CompositionTabProps) {
  const compositionData = calculateAssetCompositionData(baskt);

  return (
    <div className="h-full overflow-y-auto mt-2">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth: '800px' }}>
          <thead className="sticky top-0 bg-zinc-900/95 z-10">
            <tr className="border-b border-border">
              <th className="text-left py-2 px-2">Asset</th>
              <th className="text-left py-2">Direction</th>
              <th className="text-left py-2">Target Weight</th>
              <th className="text-left py-2">Current Weight</th>
              <th className="text-left py-2">Baseline Price</th>
              <th className="text-left py-2">Current Price</th>
              <th className="text-left py-2">Change</th>
            </tr>
          </thead>
          <tbody>
            {compositionData.map((asset, index) => (
              <tr key={index} className="border-b border-border/50">
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <AssetLogo ticker={asset.ticker} logo={asset.logo} size="md" />
                    <span>{asset.ticker}</span>
                  </div>
                </td>
                <td className="py-2">
                  <span className={getDirectionColor(asset.direction)}>
                    {getDirectionText(asset.direction)}
                  </span>
                </td>
                <td className="py-2">{asset.weight}%</td>
                <td className="py-2">{asset.currentWeight.toFixed(2)}%</td>
                <td className="py-2">
                  <NumberFormat value={asset.baselinePrice} isPrice={true} showCurrency={true} />
                </td>
                <td className="py-2">
                  <NumberFormat value={asset.currentPrice} isPrice={true} showCurrency={true} />
                </td>
                <td className="py-2">
                  <span className={getChangeColor(asset.changePercentage)}>
                    {formatChangePercentage(asset.changePercentage)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
