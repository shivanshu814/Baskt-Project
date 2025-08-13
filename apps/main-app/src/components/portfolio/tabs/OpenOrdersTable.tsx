'use client';

import { NumberFormat, useBasktClient } from '@baskt/ui';
import { usePortfolioOrders } from '../../../hooks/portfolio/use-portfolio-orders';
import { ProcessedOrder } from '../../../types/components/ui/ui';
import { formatOrderTime } from '../../../utils/formatters/formatters';

export function OpenOrdersTable() {
  const { client } = useBasktClient();
  const userAddress = client?.wallet?.address?.toString();
  const { orders, isLoading, isError } = usePortfolioOrders(userAddress);

  if (!userAddress) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Please connect your wallet to view open orders</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading open orders...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Failed to load open orders</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[800px]">
        <thead className="sticky top-0 bg-zinc-900/95 z-10 border-b border-border">
          <tr>
            <th className="text-left py-2 px-2">Baskt</th>
            <th className="text-left py-2 px-2">Time</th>
            <th className="text-left py-2 px-2">Type</th>
            <th className="text-left py-2 px-2">Direction</th>
            <th className="text-left py-2 px-2">Size</th>
            <th className="text-left py-2 px-2">Price</th>
            <th className="text-left py-2 px-2">Limit Price</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-8 px-2 text-center text-muted-foreground">
                No open orders found
              </td>
            </tr>
          ) : (
            orders.map((order: ProcessedOrder, index: number) => (
              <tr key={index} className="border-b border-border/50">
                <td className="py-2 px-2">
                  <span className="text-sm font-medium">{order.basktName}</span>
                </td>
                <td className="py-2 px-2">{formatOrderTime(order.orderTime)}</td>
                <td className="py-2 px-2">
                  <span className="text-blue-500">
                    {order.orderType === 'Market' ? 'Limit' : 'Market'}
                  </span>
                </td>
                <td className="py-2 px-2">
                  <span className={order.isLong ? 'text-green-500' : 'text-red-500'}>
                    {order.isLong ? 'Long' : 'Short'}
                  </span>
                </td>
                <td className="py-2 px-2">
                  <NumberFormat value={order.orderSize} isPrice={true} />
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
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
