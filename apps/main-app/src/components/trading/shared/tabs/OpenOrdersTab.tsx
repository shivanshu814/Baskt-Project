'use client';

import { NumberFormat } from '@baskt/ui';
import { OpenOrdersTabProps } from '../../../../types/baskt/trading/components/tabs';
import { formatOrderTime } from '../../../../utils/formatters/formatters';

export function OpenOrdersTab({ baskt, orders, onCancelOrder }: OpenOrdersTabProps) {
  const hasOrders = orders.length > 0;

  return (
    <div className="overflow-x-auto -mt-4 -ml-2">
      <table className="w-full text-sm min-w-[800px]">
        <thead className="sticky top-0 bg-zinc-900/95 z-10 border-b border-border">
          <tr>
            <th className="text-left py-2 px-2">Time</th>
            <th className="text-left py-2 px-2">Type</th>
            <th className="text-left py-2 px-2">Direction</th>
            <th className="text-left py-2 px-2">Position Value</th>
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
            orders.map((order, index) => (
              <tr key={index} className="border-b border-border/50">
                <td className="py-2 px-2">{formatOrderTime(order.createdAt)}</td>
                <td className="py-2 px-2">
                  <span className="text-blue-500">{order.orderType}</span>
                </td>
                <td className="py-2 px-2">
                  <span className={order.direction === 'Long' ? 'text-green-500' : 'text-red-500'}>
                    {order.direction}
                  </span>
                </td>
                <td className="py-2 px-2">
                  <NumberFormat value={order.size} isPrice={true} />
                </td>

                <td className="py-2 px-2">
                  <NumberFormat value={order.limitPrice} isPrice={true} showCurrency={true} />
                </td>
                <td className="py-2 px-2">
                  <NumberFormat value={order.collateral} isPrice={true} showCurrency={true} />
                </td>
                <td className="py-2 px-2">
                  <button
                    onClick={() => onCancelOrder(orders[index])}
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
