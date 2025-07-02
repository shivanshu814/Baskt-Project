import React from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger, PublicKeyText } from '@baskt/ui';
import { ChevronDown } from 'lucide-react';
import { OnchainProtocolConfig } from '@baskt/types';

interface ProtocolConfigProps {
  config: OnchainProtocolConfig;
}

export function ProtocolConfig({ config }: ProtocolConfigProps) {
  if (!config) return null;

  // eslint-disable-next-line
  const formatBps = (bps: any) => {
    const value = typeof bps === 'object' && bps.toNumber ? bps.toNumber() : Number(bps);
    return `${(value / 100).toFixed(2)}%`;
  };

  // eslint-disable-next-line
  const formatNumber = (value: any) => {
    const num = typeof value === 'object' && value.toNumber ? value.toNumber() : Number(value);
    return num.toLocaleString();
  };

  // eslint-disable-next-line
  const formatTimestamp = (timestamp: any) => {
    const ts =
      typeof timestamp === 'object' && timestamp.toNumber
        ? timestamp.toNumber()
        : Number(timestamp);
    if (ts === 0) return 'Never';
    return new Date(ts * 1000).toLocaleString();
  };

  // eslint-disable-next-line
  const treasuryCutBps = (config as any).treasuryCutBps;
  // eslint-disable-next-line
  const fundingCutBps = (config as any).fundingCutBps;

  return (
    <Collapsible className="mb-6 border border-border rounded-md overflow-hidden">
      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-accent/50">
        <h3 className="text-lg font-medium text-foreground">Protocol Configuration</h3>
        <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform ui-open:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="p-3 pt-0 grid grid-cols-2 gap-2">
          <div className="text-foreground font-medium col-span-2 mt-2">Fee Parameters:</div>
          <div className="text-muted-foreground">Opening Fee:</div>
          <div className="font-medium">{formatBps(config.openingFeeBps)}</div>

          <div className="text-muted-foreground">Closing Fee:</div>
          <div className="font-medium">{formatBps(config.closingFeeBps)}</div>

          <div className="text-muted-foreground">Liquidation Fee:</div>
          <div className="font-medium">{formatBps(config.liquidationFeeBps)}</div>

          {treasuryCutBps !== undefined && (
            <>
              <div className="text-muted-foreground">Treasury Cut:</div>
              <div className="font-medium">{formatBps(treasuryCutBps)}</div>
            </>
          )}

          {fundingCutBps !== undefined && (
            <>
              <div className="text-muted-foreground">Funding Cut:</div>
              <div className="font-medium">{formatBps(fundingCutBps)}</div>
            </>
          )}

          <div className="text-foreground font-medium col-span-2 mt-2">Funding Parameters:</div>
          <div className="text-muted-foreground">Max Funding Rate:</div>
          <div className="font-medium">{formatBps(config.maxFundingRateBps)}</div>

          <div className="text-muted-foreground">Funding Interval:</div>
          <div className="font-medium">{formatNumber(config.fundingIntervalSeconds)} seconds</div>

          <div className="text-foreground font-medium col-span-2 mt-2">Risk Parameters:</div>
          <div className="text-muted-foreground">Min Collateral Ratio:</div>
          <div className="font-medium">{formatBps(config.minCollateralRatioBps)}</div>

          <div className="text-muted-foreground">Liquidation Threshold:</div>
          <div className="font-medium">{formatBps(config.liquidationThresholdBps)}</div>

          <div className="text-foreground font-medium col-span-2 mt-2">Oracle Parameters:</div>
          <div className="text-muted-foreground">Max Price Age:</div>
          <div className="font-medium">{formatNumber(config.maxPriceAgeSec)} seconds</div>

          <div className="text-muted-foreground">Max Price Deviation:</div>
          <div className="font-medium">{formatBps(config.maxPriceDeviationBps)}</div>

          <div className="text-muted-foreground">Liquidation Price Deviation:</div>
          <div className="font-medium">{formatBps(config.liquidationPriceDeviationBps)}</div>

          <div className="text-foreground font-medium col-span-2 mt-2">Pool Parameters:</div>
          <div className="text-muted-foreground">Min Liquidity:</div>
          <div className="font-medium">{formatNumber(config.minLiquidity)}</div>

          <div className="text-foreground font-medium col-span-2 mt-2">Baskt Parameters:</div>
          <div className="text-muted-foreground">Decommission Grace Period:</div>
          <div className="font-medium">{formatNumber(config.decommissionGracePeriod)} seconds</div>

          <div className="text-foreground font-medium col-span-2 mt-2">Metadata:</div>
          <div className="text-muted-foreground">Last Updated:</div>
          <div className="font-medium">{formatTimestamp(config.lastUpdated)}</div>

          <div className="text-muted-foreground">Last Updated By:</div>
          <div className="font-medium text-sm break-all">
            <PublicKeyText publicKey={config.lastUpdatedBy} isCopy={true} noFormat={true} />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
