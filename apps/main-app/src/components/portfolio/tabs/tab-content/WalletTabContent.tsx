'use client';

import { AssetBreakdown } from '../../asset/AssetBreakdown';
import { BasktBreakdown } from '../../baskt/BasktBreakdown';
import { WalletTabType } from '../WalletTabControls';

export interface WalletTabContentProps {
  activeTab: WalletTabType;
  tradedBaskts: any[];
  uniqueAssets: any[];
  isLoading: boolean;
  error: any;
  positions: any[];
  baskts: any[];
}

export const WalletTabContent = ({
  activeTab,
  tradedBaskts,
  uniqueAssets,
  isLoading,
  error,
  positions,
  baskts,
}: WalletTabContentProps) => {
  switch (activeTab) {
    case 'baskts':
      return <BasktBreakdown tradedBaskts={tradedBaskts} isLoading={isLoading} error={error} />;
    case 'assets':
      return (
        <AssetBreakdown
          uniqueAssets={uniqueAssets}
          isLoading={isLoading}
          error={error}
          positions={positions}
          baskts={baskts}
        />
      );
    default:
      return <BasktBreakdown tradedBaskts={tradedBaskts} isLoading={isLoading} error={error} />;
  }
};
