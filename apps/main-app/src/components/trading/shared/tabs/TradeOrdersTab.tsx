import { calculateCollateralAmount } from '@baskt/sdk';
import { Input, NumberFormat } from '@baskt/ui';
import { BN } from '@coral-xyz/anchor';
import { useState } from 'react';
import { TradeOrdersTabProps } from '../../../../types/trading/orders';

export function TradeOrdersTab({
  baskt,
  usdcBalance,
  positions,
  priceColor,
  getLiquidationPrice,
  calculateTotalPositions,
}: TradeOrdersTabProps) {
  const [selectedPosition, setSelectedPosition] = useState<'long' | 'short'>('long');
  const [size, setSize] = useState('0');
  const [sizePercentage, setSizePercentage] = useState(0);

  const handleLocalPercentageChange = (percentage: number) => {
    setSizePercentage(percentage);
    const usdcBalanceNum = parseFloat(usdcBalance) || 0;
    const newSize = ((usdcBalanceNum * percentage) / 100).toString();
    setSize(newSize);
  };
  return (
    <div className="h-full flex flex-col justify-between">
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedPosition('long')}
          className={`flex-1 py-2 px-4 rounded-sm font-medium transition-colors border ${
            selectedPosition === 'long'
              ? 'bg-[#16C784]/10 text-[#16C784] border-[#16C784] hover:bg-[#16C784]/30 hover:text-[#16C784]'
              : 'bg-zinc-800 text-muted-foreground border-border hover:bg-[#16C784]/10 hover:text-[#16C784]'
          }`}
        >
          Long
        </button>
        <button
          onClick={() => setSelectedPosition('short')}
          className={`flex-1 py-2 px-4 rounded-sm font-medium transition-colors border ${
            selectedPosition === 'short'
              ? 'bg-[#EA3943]/10 text-[#EA3943] border-[#EA3943] hover:bg-[#EA3943]/30 hover:text-[#EA3943]'
              : 'bg-zinc-800 text-muted-foreground border-border hover:bg-[#EA3943]/10 hover:text-[#EA3943]'
          }`}
        >
          Short
        </button>
      </div>

      <div className="flex justify-between items-center mt-2 sm:mt-0">
        <span className="text-sm text-muted-foreground">Available Funds</span>
        <div className="text-sm font-semibold">
          <NumberFormat value={Number(usdcBalance) * 1e6 || 0} isPrice={true} showCurrency={true} />
        </div>
      </div>

      <div className="flex justify-between items-center mt-1">
        <span className="text-sm text-muted-foreground">Current Position</span>
        <div className="text-sm font-semibold">
          {positions.length > 0
            ? (() => {
                const totals = calculateTotalPositions(positions);
                const hasLong = totals.long > 0;
                const hasShort = totals.short > 0;

                return (
                  <div className="flex flex-col items-end space-y-1">
                    {hasLong && (
                      <span className="text-xs">
                        <span className="text-green-500">Long</span>{' '}
                        <NumberFormat value={totals.long} isPrice={true} showCurrency={false} />{' '}
                        units
                      </span>
                    )}
                    {hasShort && (
                      <span className="text-xs">
                        <span className="text-red-500">Short</span>{' '}
                        <NumberFormat value={totals.short} isPrice={true} showCurrency={false} />{' '}
                        units
                      </span>
                    )}
                  </div>
                );
              })()
            : 'No Position'}
        </div>
      </div>

      <div className="mt-3 flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Current Price</span>
        <span className={`text-sm font-semibold ${priceColor}`}>
          <NumberFormat value={baskt?.price || 0} isPrice={true} showCurrency={true} />
        </span>
      </div>

      <div className="mt-3 space-y-2">
        <span className="text-sm text-muted-foreground">Size</span>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={size}
            onChange={(e) => {
              const newSize = e.target.value;
              setSize(newSize);
              const usdcBalanceNum = parseFloat(usdcBalance) || 0;
              if (usdcBalanceNum > 0 && newSize && parseFloat(newSize) > 0) {
                const newPercentage = (parseFloat(newSize) / usdcBalanceNum) * 100;
                setSizePercentage(Math.min(newPercentage, 100));
              } else {
                setSizePercentage(0);
              }
            }}
            placeholder="0"
            className="flex-1"
          />
          <span className="text-sm text-muted-foreground">USDC</span>
        </div>
      </div>

      {selectedPosition === 'short' && (
        <div className="mt-2 flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Liquidation Price</span>
          <span className="text-sm font-semibold text-red-500">
            {(() => {
              const liquidationPrice = getLiquidationPrice(Number(size) || 0, selectedPosition);
              return liquidationPrice !== null ? (
                <NumberFormat value={liquidationPrice} isPrice={true} showCurrency={true} />
              ) : (
                '---'
              );
            })()}
          </span>
        </div>
      )}

      <div className="mt-2 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Size Percentage</span>
          <span>{sizePercentage.toFixed(2)}%</span>
        </div>
        <div className="relative">
          <input
            type="range"
            min="0"
            max="100"
            value={sizePercentage}
            onChange={(e) => {
              handleLocalPercentageChange(Number(e.target.value));
            }}
            className={`w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer ${
              selectedPosition === 'long'
                ? '[&::-webkit-slider-thumb]:bg-[#16C784] [&::-moz-range-thumb]:bg-[#16C784]'
                : '[&::-webkit-slider-thumb]:bg-[#EA3943] [&::-moz-range-thumb]:bg-[#EA3943]'
            }`}
            style={{
              background: `linear-gradient(to right, ${
                selectedPosition === 'long' ? 'rgb(22 199 132)' : 'rgb(234 57 67)'
              } 0%, ${
                selectedPosition === 'long' ? 'rgb(22 199 132)' : 'rgb(234 57 67)'
              } ${sizePercentage}%, rgb(63 63 70) ${sizePercentage}%, rgb(63 63 70) 100%)`,
            }}
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      <div className="mt-4 mb-4 space-y-2">
        <div className="flex items-center gap-2">
          <input type="checkbox" id="reduce-only" className="rounded" />
          <label htmlFor="reduce-only" className="text-sm">
            Reduce only
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="tp-sl" className="rounded" />
          <label htmlFor="tp-sl" className="text-sm">
            TP/SL
          </label>
        </div>
      </div>

      <button
        className={`w-full py-3 font-medium rounded-sm border border-border disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
          selectedPosition === 'long'
            ? 'bg-[#16C784]/10 text-[#16C784] border-[#16C784] hover:bg-[#16C784]/30 hover:text-[#16C784]'
            : 'bg-[#EA3943]/10 text-[#EA3943] border-[#EA3943] hover:bg-[#EA3943]/30 hover:text-[#EA3943]'
        }`}
        disabled={!baskt?.isActive || Number(size) <= 0}
      >
        {!baskt?.isActive
          ? 'Baskt Not Active'
          : Number(size) <= 0
          ? 'Enter Size'
          : `${selectedPosition === 'long' ? 'Buy / Long' : 'Sell / Short'}`}
      </button>

      <div className="space-y-2 pt-4 border-t border-border mt-auto">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Current Price</span>
          <span className={priceColor}>
            <NumberFormat value={baskt.price} isPrice={true} showCurrency={true} />
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Size</span>
          <span>
            <NumberFormat value={Number(size) || 0} isPrice={true} showCurrency={true} />
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Position Size</span>
          <span>
            {Number(size) > 0 && baskt?.price
              ? `${((Number(size) / baskt.price) * 1e6).toFixed(6)} units`
              : '---'}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Collateral</span>
          <span>
            <NumberFormat
              value={calculateCollateralAmount(new BN(parseFloat(size) || 0)).toNumber()}
              isPrice={true}
              showCurrency={true}
            />
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Liquidation Price</span>
          <span className="text-red-500">
            {(() => {
              const liquidationPrice = getLiquidationPrice(Number(size) || 0, selectedPosition);
              return liquidationPrice !== null ? (
                <NumberFormat value={liquidationPrice} isPrice={true} showCurrency={true} />
              ) : (
                '---'
              );
            })()}
          </span>
        </div>
      </div>
    </div>
  );
}
