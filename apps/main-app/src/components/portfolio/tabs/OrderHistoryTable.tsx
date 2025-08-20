'use client';

import {
  NumberFormat,
  PublicKeyText,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@baskt/ui';
import { OrderHistoryTableProps } from '../../../types/portfolio';
import { formatOrderTime } from '../../../utils/formatters/formatters';

export function OrderHistoryTable({ orderHistory }: OrderHistoryTableProps) {
  if (!orderHistory || orderHistory.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No order history found</p>
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
            <TableHead className="whitespace-nowrap">Order Type</TableHead>
            <TableHead>Direction</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="whitespace-nowrap">Filled Amount</TableHead>
            <TableHead>Fees</TableHead>
            <TableHead>Transaction</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orderHistory.map((order: any, index: number) => (
            <TableRow key={order.orderId || index}>
              <TableCell>
                <span className="text-sm font-medium">{order.basktName}</span>
              </TableCell>
              <TableCell>
                <div className="text-xs">
                  <div className="">{formatOrderTime(order.orderTime)}</div>
                </div>
              </TableCell>
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
                {order.price === 0 ? (
                  <span className="text-blue-500">Market</span>
                ) : (
                  <NumberFormat value={order.price} isPrice={true} showCurrency={true} />
                )}
              </TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === 'FILLED'
                      ? 'bg-green-500/20 text-green-500'
                      : order.status === 'PENDING'
                      ? 'bg-yellow-500/20 text-yellow-500'
                      : order.status === 'OPEN'
                      ? 'bg-blue-500/20 text-blue-500'
                      : 'bg-gray-500/20 text-gray-500'
                  }`}
                >
                  {order.status}
                </span>
              </TableCell>
              <TableCell>
                <NumberFormat value={order.filledAmount} isPrice={true} />
              </TableCell>
              <TableCell>
                <NumberFormat
                  value={order.status === 'OPEN' ? order.fees / 1e6 : order.fees}
                  isPrice={true}
                  showCurrency={true}
                />
              </TableCell>
              <TableCell>
                <div className="text-xs">
                  {order.transactionHash ? (
                    <PublicKeyText publicKey={order.transactionHash} isCopy={true} />
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
