'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useBasktFundingIndex } from '../../hooks/baskts/useBasktFundingIndex';
import { formatTimestamp, formatNumber } from '../../utils/format';
import { FundingIndexTableProps } from '../../types/baskt';

export function FundingIndexTable({ basktId }: FundingIndexTableProps) {
  const {
    fundingIndex,
    loading,
    error,
    initializeFundingIndex,
    updateFundingIndex,
  } = useBasktFundingIndex(basktId);

  const [newRate, setNewRate] = useState<string>('');

  const handleUpdateRate = () => {
    const rateNumber = parseInt(newRate, 10);
    if (!isNaN(rateNumber)) {
      updateFundingIndex(rateNumber);
      setNewRate('');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-20">
        <p className="text-white/60">Loading funding indices...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border-b border-red-500/20">
        <p className="text-red-500 text-sm">{error.message}</p>
      </div>
    );
  }

  if (!fundingIndex) {
    return (
      <div className="text-center py-8">
        <p className="text-white/60 mb-4">No funding indices available for this Baskt</p>
        <Button
          onClick={initializeFundingIndex}
        >
          {
            'Initialize Funding Index'
          }
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2">Baskt ID</th>
              <th className="text-right py-2">Cumulative Index</th>
              <th className="text-right py-2">Current Rate (BPS)</th>
              <th className="text-right py-2">Last Update</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-white/5">
              <td className="py-2 font-mono text-xs">{fundingIndex.basktId.toString()}</td>
              <td className="py-2 text-right">{formatNumber(Number(fundingIndex.cumulativeIndex) || 0)}</td>
              <td className="py-2 text-right">{fundingIndex.currentRate.toString()} BPS</td>
              <td className="py-2 text-right">{formatTimestamp(fundingIndex.lastUpdateTimestamp)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 pt-4">
        <Input
          type="number"
          placeholder="New rate in BPS (e.g., 50 for 0.5%)"
          value={newRate}
          onChange={(e) => setNewRate(e.target.value)}
          className="flex-grow"
        />
        <Button
          onClick={handleUpdateRate}
          disabled={!newRate}
        >
          {
            'Update Rate'
          }
        </Button>
      </div>
    </div>
  );
}
