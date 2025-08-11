import { NumberFormat } from '@baskt/ui';
import { OrderInfoCardProps } from '../../../../types/trading/orders';

export function OrderInfoCard({ order }: OrderInfoCardProps) {
  const orderType = order?.isLong ? 'Long' : 'Short';
  const orderTypeColor = order?.isLong ? 'text-green-500' : 'text-red-500';
  const orderSize = order?.orderSize || order?.size || 0;
  const orderPrice = order?.orderPrice || order?.price || 0;
  const orderCollateral = order?.orderCollateral || 0;

  return (
    <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Order Type</span>
          <span className={`font-semibold ${orderTypeColor}`}>{orderType}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Size</span>
          <span className="font-semibold text-foreground">
            <NumberFormat value={orderSize / 1e6} isPrice={true} />
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Price</span>
          <span className="font-semibold text-foreground">
            <NumberFormat value={orderPrice} isPrice={true} showCurrency={true} />
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Collateral</span>
          <span className="font-semibold text-foreground">
            <NumberFormat value={orderCollateral / 1e4} isPrice={true} showCurrency={true} />
          </span>
        </div>
      </div>
    </div>
  );
}
