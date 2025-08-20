'use client';

import { WalletTabContentProps } from '../../../../types/portfolio';
import { AssetBreakdown } from '../../asset/AssetBreakdown';
import { BasktBreakdown } from '../../baskt/BasktBreakdown';

export const WalletTabContent = ({
  activeTab,
  tradedBaskts,
  tradedAssets,
}: WalletTabContentProps) => {
  switch (activeTab) {
    case 'baskts':
      return <BasktBreakdown tradedBaskts={tradedBaskts} isLoading={false} error={null} />;
    case 'assets':
      return <AssetBreakdown uniqueAssets={tradedAssets} />;
    default:
      return <BasktBreakdown tradedBaskts={tradedBaskts} isLoading={false} error={null} />;
  }
};
