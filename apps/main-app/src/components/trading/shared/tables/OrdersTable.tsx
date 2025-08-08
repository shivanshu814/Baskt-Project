import { NumberFormat } from '@baskt/ui';
import React from 'react';
import { useOrdersTable } from '../../../../hooks/trading/tabs/use-orders-table';
import { OrdersTableProps } from '../../../../types/trading/components/tabs';
import { formatOrderTime } from '../../../../utils/formatters/formatters';

export const OrdersTable: React.FC<OrdersTableProps> = ({ orders, onCancelOrder }) => {
  const { processedOrders, hasOrders } = useOrdersTable(orders);

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
            processedOrders.map((processedOrder, index) => (
              <tr key={index} className="border-b border-border/50">
                <td className="py-2 px-2">{formatOrderTime(processedOrder.orderTime)}</td>
                <td className="py-2 px-2">
                  <span className="text-blue-500">{processedOrder.orderType}</span>
                </td>
                <td className="py-2 px-2">
                  <span className={processedOrder.positionColor}>
                    {processedOrder.positionType}
                  </span>
                </td>
                <td className="py-2 px-2">
                  <NumberFormat value={processedOrder.orderSize} isPrice={true} />
                </td>
                <td className="py-2 px-2">
                  {processedOrder.orderType === 'Market' ? (
                    <span className="text-blue-500">Market</span>
                  ) : (
                    <NumberFormat
                      value={processedOrder.orderPrice}
                      isPrice={true}
                      showCurrency={true}
                    />
                  )}
                </td>
                <td className="py-2 px-2">
                  <NumberFormat
                    value={processedOrder.limitPrice}
                    isPrice={true}
                    showCurrency={true}
                  />
                </td>
                <td className="py-2 px-2">
                  <NumberFormat
                    value={processedOrder.orderCollateral}
                    isPrice={true}
                    showCurrency={true}
                  />
                </td>
                <td className="py-2 px-2">
                  <button
                    onClick={() => onCancelOrder(processedOrder.order)}
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
};
