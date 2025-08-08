'use client';

import { NumberFormat, PublicKeyText, useBasktClient } from '@baskt/ui';
import { usePortfolioOrderHistory } from '../../../hooks/portfolio/use-portfolio-order-history';
import { ProcessedOrderHistory } from '../../../types/components/ui/ui';
import { formatOrderHistoryTime } from '../../../utils/formatters/formatters';
import { getStatusColor } from '../../../utils/validation/validation';

export function OrderHistoryTable() {
  const { client } = useBasktClient();
  const userAddress = client?.wallet?.address?.toString();
  const { orders, isLoading, isError } = usePortfolioOrderHistory(userAddress);

  if (!userAddress) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Please connect your wallet to view order history</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading order history...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Failed to load order history</p>
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
            <th className="text-left py-2 px-2 whitespace-nowrap">Order Type</th>
            <th className="text-left py-2 px-2">Direction</th>
            <th className="text-left py-2 px-2">Size</th>
            <th className="text-left py-2 px-2">Price</th>
            <th className="text-left py-2 px-2">Status</th>
            <th className="text-left py-2 px-2 whitespace-nowrap">Filled Amount</th>
            <th className="text-left py-2 px-2">Fees</th>
            <th className="text-left py-2 px-2">Transaction</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan={10} className="py-8 px-2 text-center text-muted-foreground">
                No order history found
              </td>
            </tr>
          ) : (
            orders.map((order: ProcessedOrderHistory, index: number) => {
              const { date, time } = formatOrderHistoryTime(order.orderTime);

              return (
                <tr key={index} className="border-b border-border/50">
                  <td className="py-2 px-2">
                    <span className="text-sm font-medium">{order.basktName}</span>
                  </td>
                  <td className="py-2 px-2">
                    <div className="text-xs">
                      <div className="">{date}</div>
                      <div className="text-muted-foreground">{time}</div>
                    </div>
                  </td>
                  <td className="py-2 px-2">
                    <span className="text-blue-500">{order.orderType}</span>
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
                    <span className={getStatusColor(order.status as any)}>{order.status}</span>
                  </td>
                  <td className="py-2 px-2">
                    <NumberFormat value={order.filledAmount} isPrice={true} />
                  </td>
                  <td className="py-2 px-2">
                    <NumberFormat value={order.fees} isPrice={true} showCurrency={true} />
                  </td>
                  <td className="py-2 px-2">
                    <div className="text-xs">
                      <PublicKeyText publicKey={order.transactionHash} isCopy={true} />
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
