import React, { useState } from 'react';
import { NumberFormat } from '@baskt/ui';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { BasktSwitcher } from './BasktSwitcher';
import { BasktInfo } from '@baskt/types';

interface MobileBasktHeaderProps {
  baskt: BasktInfo;
  price: number;
  change: number;
  oiLoading: boolean;
  totalOpenInterest: number;
  volumeLoading: boolean;
  totalVolume: number;
}

export const MobileBasktHeader = ({
  baskt,
  price,
  change,
  oiLoading,
  totalOpenInterest,
  volumeLoading,
  totalVolume,
}: MobileBasktHeaderProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between w-full bg-background rounded px-2 py-2 pl-0">
        <div className="flex items-center gap-2 min-w-0">
          <BasktSwitcher currentBaskt={baskt} />
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`font-semibold text-base ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}
          >
            {change ? <NumberFormat value={change} /> : '--'}%
          </span>
          <span className="font-semibold text-base text-white ml-2">
            {price ? <NumberFormat value={price} isPrice={true} showCurrency={true} /> : '--'}
          </span>
          <button
            onClick={() => setOpen((v) => !v)}
            className="ml-2 p-1 rounded hover:bg-muted/30 border border-border"
          >
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="mt-2 bg-background rounded px-3 py-2 flex flex-col gap-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Mark</span>
            <span className="font-semibold text-white">
              {price ? <NumberFormat value={price} isPrice={true} showCurrency={true} /> : '--'}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Open Interest</span>
            <span className="font-semibold text-white">
              {oiLoading ? (
                '...'
              ) : totalOpenInterest === 0 ? (
                '---'
              ) : (
                <NumberFormat value={totalOpenInterest} isPrice={true} showCurrency={true} />
              )}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">24h Volume</span>
            <span className="font-semibold text-white">
              {volumeLoading ? (
                '...'
              ) : totalVolume === 0 ? (
                '---'
              ) : (
                <NumberFormat value={totalVolume} isPrice={true} showCurrency={true} />
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
