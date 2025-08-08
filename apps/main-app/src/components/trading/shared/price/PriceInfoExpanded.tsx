import { NumberFormat } from '@baskt/ui';
import { PriceInfoExpandedProps } from '../../../../types/trading/orders';

export function PriceInfoExpanded({
  baskt,
  oiLoading,
  totalOpenInterest,
  volumeLoading,
  totalVolume,
}: PriceInfoExpandedProps) {
  return (
    <div className="px-4 pb-3 border-t border-border/50">
      <div className="grid grid-cols-2 gap-4 pt-3">
        <div className="text-sm">
          <span className="text-muted-foreground">Index Price</span>
          <div className="font-semibold">
            <NumberFormat value={baskt.price || 0} isPrice={true} showCurrency={true} />
          </div>
        </div>
        <div className="text-xs">
          <span className="text-muted-foreground">30D Change</span>
          <div
            className={`font-semibold ${
              (baskt.performance?.month || 0) >= 0 ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {(baskt.performance?.month || 0) >= 0 ? '+' : ''}
            {(baskt.performance?.month || 0).toFixed(2)}%
          </div>
        </div>
        <div className="text-xs">
          <span className="text-muted-foreground">OI</span>
          <div className="font-semibold">
            {oiLoading ? (
              '...'
            ) : totalOpenInterest === 0 ? (
              '---'
            ) : (
              <NumberFormat value={totalOpenInterest} isPrice={true} showCurrency={true} />
            )}
          </div>
        </div>
        <div className="text-xs">
          <span className="text-muted-foreground">24hr Change</span>
          <div
            className={`font-semibold ${
              (baskt.performance?.day || 0) >= 0 ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {(baskt.performance?.day || 0) >= 0 ? '+' : ''}
            {(baskt.performance?.day || 0).toFixed(2)}%
          </div>
        </div>
        <div className="text-xs">
          <span className="text-muted-foreground">24hr Volume</span>
          <div className="font-semibold">
            {volumeLoading ? (
              '...'
            ) : totalVolume === 0 ? (
              '---'
            ) : (
              <NumberFormat value={totalVolume} isPrice={true} showCurrency={true} />
            )}
          </div>
        </div>
        <div className="text-xs">
          <span className="text-muted-foreground">7D Change</span>
          <div
            className={`font-semibold ${
              (baskt.performance?.week || 0) >= 0 ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {(baskt.performance?.week || 0) >= 0 ? '+' : ''}
            {(baskt.performance?.week || 0).toFixed(2)}%
          </div>
        </div>
        <div className="text-xs">
          <span className="text-muted-foreground">Total Assets</span>
          <div className="font-semibold">{baskt.assets?.length || 0}</div>
        </div>
        <div className="text-xs">
          <span className="text-muted-foreground">30D Volatility</span>
          <div className="font-semibold text-green-500">18.5%</div>
        </div>
      </div>
    </div>
  );
}
