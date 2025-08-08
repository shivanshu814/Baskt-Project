import { Input, NumberFormat } from '@baskt/ui';
import React from 'react';
import { TradeFormProps } from '../../../../types/trading/orders';
import { calculateTradeDetails } from '../../../../utils/calculation/calculations';
import { validateTradeForm } from '../../../../utils/validation/validation';

export const TradeForm: React.FC<TradeFormProps> = ({
  formData,
  setSelectedPosition,
  setSize,
  setSizePercentage,
  setReduceOnly,
  setTpSl,
  baskt,
  usdcBalance,
  positions,
  onTrade,
  priceColor,
}) => {
  const tradeDetails = calculateTradeDetails(
    formData.size,
    baskt?.price || 0,
    formData.selectedPosition,
  );

  const isFormValid = validateTradeForm(formData);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedPosition('long')}
          className={`flex-1 py-2 px-4 rounded-sm font-medium transition-colors ${
            formData.selectedPosition === 'long'
              ? 'bg-primary text-white'
              : 'bg-zinc-800 text-muted-foreground'
          }`}
        >
          Long
        </button>
        <button
          onClick={() => setSelectedPosition('short')}
          className={`flex-1 py-2 px-4 rounded-sm font-medium transition-colors ${
            formData.selectedPosition === 'short'
              ? 'bg-primary text-white'
              : 'bg-zinc-800 text-muted-foreground'
          }`}
        >
          Short
        </button>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Available Funds</span>
        <div className="text-lg font-semibold">
          <NumberFormat value={Number(usdcBalance) * 1e6 || 0} isPrice={true} showCurrency={true} />
        </div>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Current Position</span>
        <div className="text-lg font-semibold">
          {positions.length > 0 ? (
            <div className="flex flex-col items-end space-y-1">
              {positions.map((position, index) => (
                <span key={index} className="text-xs">
                  <span className={position.isLong ? 'text-green-500' : 'text-red-500'}>
                    {position.isLong ? 'Long' : 'Short'}
                  </span>{' '}
                  <NumberFormat value={position.size} isPrice={true} showCurrency={false} /> units
                </span>
              ))}
            </div>
          ) : (
            'No Position'
          )}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Current Price</span>
        <span className={`text-lg font-semibold ${priceColor}`}>
          <NumberFormat value={baskt?.price || 0} isPrice={true} showCurrency={true} />
        </span>
      </div>

      <div className="space-y-2">
        <span className="text-sm text-muted-foreground">Size</span>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={formData.size}
            onChange={(e) => setSize(e.target.value)}
            placeholder="0"
            className="flex-1"
          />
          <span className="text-sm text-muted-foreground">USDC</span>
        </div>
      </div>

      {formData.selectedPosition === 'short' && tradeDetails.liquidationPrice && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Liquidation Price</span>
          <span className="text-sm font-semibold text-red-500">
            <NumberFormat
              value={tradeDetails.liquidationPrice}
              isPrice={true}
              showCurrency={true}
            />
          </span>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Size Percentage</span>
          <span>{formData.sizePercentage}%</span>
        </div>
        <div className="relative">
          <input
            type="range"
            min="0"
            max="100"
            value={formData.sizePercentage}
            onChange={(e) => setSizePercentage(Number(e.target.value))}
            className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-purple-500 [&::-moz-range-thumb]:cursor-pointer"
            style={{
              background: `linear-gradient(to right, rgb(147 51 234) 0%, rgb(147 51 234) ${formData.sizePercentage}%, rgb(63 63 70) ${formData.sizePercentage}%, rgb(63 63 70) 100%)`,
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

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="reduce-only"
            checked={formData.reduceOnly}
            onChange={(e) => setReduceOnly(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="reduce-only" className="text-sm">
            Reduce only
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="tp-sl"
            checked={formData.tpSl}
            onChange={(e) => setTpSl(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="tp-sl" className="text-sm">
            TP/SL
          </label>
        </div>
      </div>

      <button
        className={`w-full py-3 font-medium rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          formData.selectedPosition === 'long'
            ? 'bg-[#16C784] hover:bg-[#16C784]/90 text-white'
            : 'bg-[#EA3943] hover:bg-[#EA3943]/90 text-white'
        }`}
        onClick={() => onTrade(formData.selectedPosition)}
        disabled={!baskt?.isActive || !isFormValid}
      >
        {!baskt?.isActive
          ? 'Baskt Not Active'
          : !isFormValid
          ? 'Enter Size'
          : `${formData.selectedPosition === 'long' ? 'Buy / Long' : 'Sell / Short'}`}
      </button>

      <div className="space-y-2 pt-4 border-t border-border">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Current Price</span>
          <span className={priceColor}>
            <NumberFormat value={baskt?.price || 0} isPrice={true} showCurrency={true} />
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Size</span>
          <span>
            <NumberFormat value={Number(formData.size) || 0} isPrice={true} showCurrency={true} />
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Position Size</span>
          <span>
            {tradeDetails.positionSize > 0
              ? `${tradeDetails.positionSize.toFixed(6)} units`
              : '---'}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Collateral</span>
          <span>
            <NumberFormat value={tradeDetails.collateral} isPrice={true} showCurrency={true} />
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Liquidation Price</span>
          <span className="text-red-500">
            {tradeDetails.liquidationPrice ? (
              <NumberFormat
                value={tradeDetails.liquidationPrice}
                isPrice={true}
                showCurrency={true}
              />
            ) : (
              '---'
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
