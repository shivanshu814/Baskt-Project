'use client';

import { Button, Input, NumberFormat } from '@baskt/ui';
import { HandCoins, X } from 'lucide-react';
import { useCollateral } from '../../../../hooks/trading/actions/use-collateral';
import { formatSliderValue, preventNegativeInput } from '../../../../lib/trading/collateral';
import { AddCollateralModalProps } from '../../../../types/trading/modals';
import { generateSliderGradient } from '../../../../utils/ui/ui';

export function AddCollateralModal({ isOpen, position }: AddCollateralModalProps) {
  const {
    amount,
    amountPercentage,
    isLoading,
    handleAmountChange,
    handleSliderChange,
    handlePercentageChange,
    handleMaxAmount,
    handleSubmit,
    handleClose,
    usdcBalance,
  } = useCollateral(position);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900/95 backdrop-blur-sm border border-border rounded-lg p-6 w-full max-w-md mx-4 relative overflow-hidden">
        <div className="absolute top-10 left-10 w-20 h-20 bg-purple-500/10 rounded-full blur-xl" />
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-pink-500/5 rounded-full blur-2xl" />
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                <span className="text-purple-400 text-sm font-bold">
                  <HandCoins size={16} />
                </span>
              </div>
              <h3 className="text-xl font-bold text-foreground">Add Collateral</h3>
            </div>
            <button
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted/50"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Current Collateral</span>
                <div className="text-sm font-bold text-foreground">
                  <NumberFormat
                    value={position?.collateral || 0}
                    isPrice={true}
                    showCurrency={true}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-muted-foreground">Available USDC</span>
                <div className="text-sm font-semibold text-foreground">
                  <NumberFormat
                    value={Number(usdcBalance) * 1e6 || 0}
                    isPrice={true}
                    showCurrency={true}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Additional Amount (USDC)
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-background border-border focus:border-purple-500 focus:ring-purple-500/20"
                  min="0.00001"
                  onKeyDown={preventNegativeInput}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="px-3 py-1 text-xs font-semibold border-border hover:bg-purple-500/10"
                  onClick={handleMaxAmount}
                  tabIndex={-1}
                >
                  Max
                </Button>
              </div>

              <div className="w-full mt-4">
                <div className="relative flex items-center gap-3">
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={Math.round(parseFloat(amountPercentage || '0'))}
                        onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
                        className="w-full h-1 bg-gray-600 rounded-full appearance-none cursor-pointer slider [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-purple-500 [&::-moz-range-thumb]:cursor-pointer"
                        style={{
                          background: generateSliderGradient(parseFloat(amountPercentage || '0')),
                        }}
                        disabled={isLoading}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-2 relative">
                        <span className="absolute left-0 text-xs text-muted-foreground">0%</span>
                        <span className="absolute ml-2 left-1/4 transform -translate-x-1/2 text-xs text-muted-foreground">
                          25%
                        </span>
                        <span className="absolute ml-1 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground">
                          50%
                        </span>
                        <span className="absolute ml-1 left-3/4 transform -translate-x-1/2 text-xs text-muted-foreground">
                          75%
                        </span>
                        <span className="absolute right-0 text-xs text-muted-foreground">100%</span>
                      </div>
                    </div>
                  </div>
                  <div className="border border-border rounded-lg px-2 py-1 w-16 hover:border-purple-500">
                    <div className="flex items-center justify-center gap-1">
                      <Input
                        type="number"
                        placeholder="0"
                        className="w-12 text-center border-none bg-transparent p-0 text-sm font-medium text-white focus:ring-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        value={formatSliderValue(amountPercentage)}
                        onChange={(e) => handlePercentageChange(e.target.value)}
                        min={0}
                        max={100}
                        step={1}
                        disabled={isLoading}
                      />
                      <span className="text-sm font-medium text-white">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleClose}
                variant="outline"
                className="flex-1 border-border hover:bg-muted/50"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1 bg-primary hover:bg-primary/90 text-white font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Adding...
                  </div>
                ) : (
                  'Add Collateral'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
