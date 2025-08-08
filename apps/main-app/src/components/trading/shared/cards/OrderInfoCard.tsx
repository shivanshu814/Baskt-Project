import { NumberFormat } from '@baskt/ui';
import { OrderInfoCardProps } from '../../../../types/trading/orders';

export function OrderInfoCard({ order }: OrderInfoCardProps) {
  const orderType = order?.isLong ? 'Long' : 'Short';
  const orderTypeColor = order?.isLong ? 'text-green-500' : 'text-red-500';

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
            <NumberFormat value={order?.size || 0} isPrice={true} />
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Price</span>
          <span className="font-semibold text-foreground">
            <NumberFormat value={order?.price || 0} isPrice={true} showCurrency={true} />
          </span>
        </div>
      </div>
    </div>
  );
}
