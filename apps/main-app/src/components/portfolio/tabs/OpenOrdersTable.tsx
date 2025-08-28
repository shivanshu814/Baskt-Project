'use client';

import {
  NumberFormat,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useBasktClient,
} from '@baskt/ui';
import { useGetOrders } from '../../../hooks/trade/action/order/getOrders';
import { OpenOrdersTableProps } from '../../../types/portfolio';
import { formatOrderTime } from '../../../utils/formatters/formatters';

export function OpenOrdersTable({ openOrders }: OpenOrdersTableProps) {
  // Get current user's address
  const { client } = useBasktClient();
  const userAddress = client?.wallet?.address?.toString();

  // Use the existing useGetOrders hook
  const { orders, loading: isLoading, error } = useGetOrders(undefined, userAddress);
  console.log('orders', orders);
  if (!userAddress) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Please connect your wallet to view orders</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading your orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error loading orders: {error.message}</p>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No orders found for your wallet</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Order ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Position Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order: any, index: number) => (
            <TableRow key={order.orderId || index}>
              <TableCell>
                <div className="text-xs">
                  <div className="">
                    {formatOrderTime(order.createdAt || new Date().toISOString())}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm font-mono">{order.orderId || 'N/A'}</span>
              </TableCell>
              <TableCell>
                <span className="text-blue-500 capitalize">{order.orderType || 'Unknown'}</span>
              </TableCell>
              <TableCell>
                <span className="text-yellow-500">Pending</span>
              </TableCell>
              <TableCell>
                <NumberFormat
                  value={Number(order.sizeAsContracts) * 100}
                  isPrice={true}
                  showCurrency={true}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
