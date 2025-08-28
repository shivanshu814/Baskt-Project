'use client';

import { Button, Input, NumberFormat, useBasktClient } from '@baskt/ui';
import { BN } from '@coral-xyz/anchor';
import { Share2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useFilteredBaskts } from '../../../../hooks/baskt/use-filtered-baskts';
import { useShareLink } from '../../../../hooks/shared/use-share-link';
import { useOpenPosition } from '../../../../hooks/trade/action/position/openPosition';
import { TradingPanelProps } from '../../../../types/baskt/trading/orders';

export function TradingPanel({ combinedBaskts }: TradingPanelProps) {
  const [selectedPosition, setSelectedPosition] = useState<'long' | 'short'>('long');
  const [size, setSize] = useState('0');
  const [sizePercentage, setSizePercentage] = useState(0);
  const { client } = useBasktClient();
  const publicKey = client?.wallet?.address;

  const { currentBaskt } = useFilteredBaskts({
    combinedBaskts,
    searchQuery: '',
  });

  const prevPriceRef = useRef<number | null>(null);
  const [priceColor, setPriceColor] = useState('text-foreground');
  const currentPrice = new BN(currentBaskt?.metrics?.currentNav || 0).toNumber();

  const { shareCurrentPage } = useShareLink();

  const handleShareClick = async () => {
    await shareCurrentPage('Link copied! You can now share this baskt.');
  };

  const handleLocalPercentageChange = (percentage: number) => {
    setSizePercentage(percentage);
    const usdcBalanceNum = parseFloat(hookUsdcBalance) || 0;
    const newSize = ((usdcBalanceNum * percentage) / 100).toString();
    setSize(newSize);
  };
  const {
    isLoading,
    openPosition,
    collateral,
    getLiquidationPrice,
    usdcBalance: hookUsdcBalance,
    userUSDCAccount,
  } = useOpenPosition(
    currentBaskt?.baskt?.basktId,
    publicKey,
    currentBaskt,
    Number(size) || 0,
    new BN(currentPrice),
  );

  useEffect(() => {
    if (prevPriceRef.current !== null) {
      if (currentPrice > prevPriceRef.current) {
        setPriceColor('text-green-500');
      } else if (currentPrice < prevPriceRef.current) {
        setPriceColor('text-red-500');
      } else {
        setPriceColor('text-foreground');
      }
    }
    prevPriceRef.current = currentPrice;
  }, [currentPrice]);

  const handleTrade = async (position: 'long' | 'short') => {
    if (!publicKey || !client || !userUSDCAccount) {
      toast.error('Please connect your wallet first');
      return;
    }

    if ((currentBaskt as any)?.baskt?.status !== 'active') {
      toast.error('This baskt is not active yet. Please try again later.');
      return;
    }

    try {
      await openPosition(position, Number(size));
      setSize('0');
      setSizePercentage(0);
    } catch (error) {
      console.error('Error opening position:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-lg sm:text-xl font-semibold">
              Trade {currentBaskt?.baskt?.name}
            </span>
          </div>
          <span className={`text-lg font-bold sm:text-xl ml-2 ${priceColor}`}>
            <NumberFormat value={currentPrice} isPrice={true} showCurrency={true} />
          </span>
        </div>
        <button
          onClick={handleShareClick}
          className="p-2 hover:bg-muted rounded-md transition-colors"
          title="Share Baskt"
        >
          <Share2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </button>
      </div>
      {(currentBaskt as any)?.baskt?.status !== 'active' ? (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-yellow-500 text-xs sm:text-sm">
            This baskt is not active yet. Please try again later.
          </p>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className={`flex-1 transition-colors ${
                selectedPosition === 'long'
                  ? 'bg-[#16C784]/10 text-[#16C784] border-[#16C784] hover:bg-[#16C784]/30 hover:text-[#16C784]'
                  : 'text-muted-foreground hover:bg-[#16C784]/10 hover:text-[#16C784]'
              }`}
              onClick={() => setSelectedPosition('long')}
            >
              Long
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`flex-1 transition-colors ${
                selectedPosition === 'short'
                  ? 'bg-[#EA3943]/10 text-[#EA3943] border-[#EA3943] hover:bg-[#EA3943]/30 hover:text-[#EA3943]'
                  : 'text-muted-foreground hover:bg-[#EA3943]/10 hover:text-[#EA3943]'
              }`}
              onClick={() => setSelectedPosition('short')}
            >
              Short
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Available</span>
              <span className="font-semibold">
                <NumberFormat
                  value={Number(hookUsdcBalance) * 1e6 || 0}
                  isPrice={true}
                  showCurrency={true}
                />
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">Size</label>
              <span className="text-sm text-muted-foreground">USDC</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none select-none">
                $
              </span>
              <Input
                type="number"
                placeholder="0.00"
                value={size}
                onChange={(e) => {
                  const newSize = e.target.value;
                  setSize(newSize);

                  const usdcBalanceNum = parseFloat(hookUsdcBalance) || 0;
                  if (usdcBalanceNum > 0 && newSize && parseFloat(newSize) > 0) {
                    const newPercentage = (parseFloat(newSize) / usdcBalanceNum) * 100;
                    setSizePercentage(Math.min(newPercentage, 100));
                  } else {
                    setSizePercentage(0);
                  }
                }}
                className="mb-2 text-right pl-7"
                disabled={isLoading}
                min="0.00001"
                onKeyDown={(e) => {
                  if (e.key === '-') {
                    e.preventDefault();
                  }
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
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
                <span className="ml-10">25%</span>
                <span className="ml-10">50%</span>
                <span className="ml-10">75%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Current Price:</span>
              <span className={priceColor}>
                <NumberFormat value={currentPrice} isPrice={true} showCurrency={true} />
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Collateral:</span>
              <span>
                <NumberFormat value={collateral.toNumber()} isPrice={true} showCurrency={true} />
              </span>
            </div>
            {selectedPosition === 'short' && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Liquidation Price:</span>
                <span className="text-red-500">
                  {(() => {
                    const liquidationPrice = getLiquidationPrice(
                      Number(size) || 0,
                      selectedPosition,
                    );
                    return liquidationPrice !== null ? (
                      <NumberFormat value={liquidationPrice} isPrice={true} showCurrency={true} />
                    ) : (
                      '---'
                    );
                  })()}
                </span>
              </div>
            )}
          </div>

          <Button
            className={`w-full border border-border disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
              selectedPosition === 'long'
                ? 'bg-[#16C784]/10 text-[#16C784] border-[#16C784] hover:bg-[#16C784]/30 hover:text-[#16C784]'
                : 'bg-[#EA3943]/10 text-[#EA3943] border-[#EA3943] hover:bg-[#EA3943]/30 hover:text-[#EA3943]'
            }`}
            onClick={() => handleTrade(selectedPosition)}
            disabled={
              isLoading || (currentBaskt as any)?.baskt?.status !== 'active' || Number(size) <= 0
            }
          >
            {isLoading
              ? 'Confirming...'
              : (currentBaskt as any)?.baskt?.status !== 'active'
              ? 'Baskt Not Active'
              : Number(size) <= 0
              ? 'Enter Size'
              : `${selectedPosition === 'long' ? 'Buy / Long' : 'Sell / Short'}`}
          </Button>
        </>
      )}
    </div>
  );
}
