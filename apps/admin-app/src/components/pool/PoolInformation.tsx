import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@baskt/ui';
import { CopyField } from './CopyField';
import type { PoolInformationProps } from '../../types/pool';
import { useAllFeeEventData } from '../../hooks/pool/usePoolFeeEvents';
import { PoolFeeStatsComponent } from './PoolFeeStats';
import { PoolFeeEventsComponent } from './PoolFeeEvents';

export const PoolInformation: React.FC<PoolInformationProps> = ({ poolData }) => {
  const {
    feeEvents,
    feeStats,
    isLoadingEvents,
    isLoadingStats,
    eventsError,
    statsError,
    totalFeesFormatted,
    avgFeePerEvent,
    eventTypeBreakdown,
  } = useAllFeeEventData();

  return (
    <div className="space-y-6">
      <Card className="bg-white/5 border-white/10 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">Pool Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-white/60 text-sm">Total Liquidity</div>
                <div className="text-lg font-semibold text-primary">{poolData.totalLiquidity}</div>
                <div className="text-xs text-white/40">Total amount of liquidity in the pool</div>
              </div>
              <div>
                <div className="text-white/60 text-sm">Total Shares</div>
                <div className="text-lg font-semibold text-primary">{poolData.totalShares}</div>
                <div className="text-xs text-white/40">Total supply of LP tokens</div>
              </div>
            </div>
            <hr className="border-white/10" />

            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-white/60 text-sm">Deposit Fee</div>
                <div className="text-lg font-semibold text-primary">{poolData.depositFee}</div>
                <div className="text-xs text-white/40">Fee on deposits (bps)</div>
              </div>
              <div>
                <div className="text-white/60 text-sm">Withdrawal Fee</div>
                <div className="text-lg font-semibold text-primary">{poolData.withdrawalFee}</div>
                <div className="text-xs text-white/40">Fee on withdrawals (bps)</div>
              </div>
            </div>
            <hr className="border-white/10" />

            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-white/60 text-sm">Minimum Deposit</div>
                <div className="text-lg font-semibold text-primary">{poolData.minDeposit}</div>
                <div className="text-xs text-white/40">Minimum deposit allowed</div>
              </div>
              <div>
                <div className="text-white/60 text-sm">Last Update</div>
                <div className="text-lg font-semibold text-primary">{poolData.lastUpdate}</div>
                <div className="text-xs text-white/40">Last pool update</div>
              </div>
            </div>
            <hr className="border-white/10" />

            <CopyField value={poolData.lpMint} label="LP Token Mint" />
            <div className="text-xs text-white/40 mb-2">The token mint for the LP tokens</div>
            <CopyField value={poolData.tokenVault} label="Token Vault" />
            <div className="text-xs text-white/40">The token account where collateral is stored</div>
            <hr className="border-white/10" />

            <div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Bump</span>
                <span className="text-lg font-semibold text-primary">{poolData.bump}</span>
              </div>
              <div className="text-xs text-white/40">Bump for this PDA</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fee Statistics */}
      <PoolFeeStatsComponent
        feeStats={feeStats}
        isLoading={isLoadingStats}
        error={statsError}
        totalFeesFormatted={totalFeesFormatted}
        avgFeePerEvent={avgFeePerEvent}
        eventTypeBreakdown={eventTypeBreakdown}
      />

      {/* Recent Fee Events */}
      <PoolFeeEventsComponent
        feeEvents={feeEvents}
        isLoading={isLoadingEvents}
        error={eventsError}
      />
    </div>
  );
};
