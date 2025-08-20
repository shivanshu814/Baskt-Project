'use client';

import {
  NumberFormat,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@baskt/ui';
import { OpenOrdersTableProps } from '../../../types/portfolio';
import { formatOrderTime } from '../../../utils/formatters/formatters';

export function OpenOrdersTable({ openOrders }: OpenOrdersTableProps) {
  if (!openOrders || openOrders.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No open orders found</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead>Baskt</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Direction</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Current Price</TableHead>
            <TableHead>Fees</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {openOrders.map((order: any, index: number) => (
            <TableRow key={order.orderId || index}>
              <TableCell>
                <span className="text-sm font-medium">{order.basktName}</span>
              </TableCell>
              <TableCell>{formatOrderTime(order.orderTime)}</TableCell>
              <TableCell>
                <span className="text-blue-500 capitalize">{order.orderType}</span>
              </TableCell>
              <TableCell>
                <span className={order.direction === 'long' ? 'text-green-500' : 'text-red-500'}>
                  {order.direction.charAt(0).toUpperCase() + order.direction.slice(1)}
                </span>
              </TableCell>
              <TableCell>
                <NumberFormat value={order.size} isPrice={true} />
              </TableCell>
              <TableCell>
                <NumberFormat value={order.currentPrice} isPrice={true} showCurrency={true} />
              </TableCell>
              <TableCell>
                <NumberFormat value={order.fees} isPrice={true} showCurrency={true} />
              </TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded-sm text-xs font-medium ${
                    order.status === 'PENDING'
                      ? 'bg-yellow-500/20 text-yellow-500'
                      : order.status === 'FILLED'
                      ? 'bg-green-500/20 text-green-500'
                      : 'bg-gray-500/20 text-gray-500'
                  }`}
                >
                  {order.status}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
