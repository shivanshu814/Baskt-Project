import { NumberFormat, PublicKeyText } from '@baskt/ui';
import { useOrdersHistory } from '../../../../hooks/trading/tabs/use-orders-history';
import { OrdersHistoryTabProps } from '../../../../types/trading/components/tabs';
import { formatOrderHistoryTime } from '../../../../utils/formatters/formatters';
import { getStatusColor } from '../../../../utils/validation/validation';

export function OrdersHistoryTab({ baskt, orders }: OrdersHistoryTabProps) {
  const { processedOrders, hasOrders } = useOrdersHistory(orders, baskt);

  return (
    <div className="overflow-x-auto -mt-4 -ml-2">
      <table className="w-full text-sm min-w-[800px]">
        <thead className="sticky top-0 bg-zinc-900/95 z-10 border-b border-border">
          <tr>
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
          {!hasOrders ? (
            <tr>
              <td colSpan={9} className="py-8 px-2 text-center text-muted-foreground">
                No order history found
              </td>
            </tr>
          ) : (
            processedOrders.map((order, index) => {
              const { date, time } = formatOrderHistoryTime(order.orderTime);

              return (
                <tr key={index} className="border-b border-border/50">
                  <td className="py-2 px-2">
                    <div className="text-xs">
                      <div className="">{date}</div>
                      <div className="text-muted-foreground">{time}</div>
                    </div>
                  </td>
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
                    <NumberFormat
                      value={order.isLong ? order.orderSize : order.orderSize / 1e6}
                      isPrice={true}
                    />
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
                    <NumberFormat
                      value={order.isLong ? order.filledAmount * 1e2 : order.filledAmount / 1e4}
                      isPrice={true}
                      showCurrency={true}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <NumberFormat
                      value={order.isLong ? order.fees : order.fees / 1e6}
                      isPrice={true}
                      showCurrency={true}
                    />
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
