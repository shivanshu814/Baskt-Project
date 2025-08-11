'use client';

import { NumberFormat } from '@baskt/ui';
import { useOpenOrders } from '../../../../hooks/trading/tabs/use-open-orders';
import { OpenOrdersTabProps } from '../../../../types/trading/components/tabs';
import { formatOrderTime } from '../../../../utils/formatters/formatters';

export function OpenOrdersTab({ baskt, orders, onCancelOrder }: OpenOrdersTabProps) {
  const { processedOrders, hasOrders } = useOpenOrders(orders, baskt);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[800px]">
        <thead className="sticky top-0 bg-zinc-900/95 z-10 border-b border-border">
          <tr>
            <th className="text-left py-2 px-2">Time</th>
            <th className="text-left py-2 px-2">Type</th>
            <th className="text-left py-2 px-2">Direction</th>
            <th className="text-left py-2 px-2">Size</th>
            <th className="text-left py-2 px-2">Price</th>
            <th className="text-left py-2 px-2">Limit Price</th>
            <th className="text-left py-2 px-2">Collateral</th>
            <th className="text-left py-2 px-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {!hasOrders ? (
            <tr>
              <td colSpan={8} className="py-8 px-2 text-center text-muted-foreground">
                No open orders found
              </td>
            </tr>
          ) : (
            processedOrders.map((order, index) => (
              <tr key={index} className="border-b border-border/50">
                <td className="py-2 px-2">{formatOrderTime(order.orderTime)}</td>
                <td className="py-2 px-2">
                  <span className="text-blue-500">{order.orderType}</span>
                </td>
                <td className="py-2 px-2">
                  <span className={order.isLong ? 'text-green-500' : 'text-red-500'}>
                    {order.isLong ? 'Long' : 'Short'}
                  </span>
                </td>
                <td className="py-2 px-2">
                  <NumberFormat value={order.orderSize / 1e6} isPrice={true} />
                </td>
                <td className="py-2 px-2">
                  {order.orderType === 'Market' ? (
                    <span className="text-blue-500">Market</span>
                  ) : (
                    <NumberFormat value={order.orderPrice} isPrice={true} showCurrency={true} />
                  )}
                </td>
                <td className="py-2 px-2">
                  <NumberFormat value={order.limitPrice} isPrice={true} showCurrency={true} />
                </td>
                <td className="py-2 px-2">
                  <NumberFormat
                    value={order.orderCollateral / 1e4}
                    isPrice={true}
                    showCurrency={true}
                  />
                </td>
                <td className="py-2 px-2">
                  <button
                    onClick={() => onCancelOrder(processedOrders[index])}
                    className="text-xs px-2 py-1 bg-red-500/20 text-red-500 rounded hover:bg-red-500/30 transition-colors"
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
