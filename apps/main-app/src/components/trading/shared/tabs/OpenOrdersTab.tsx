'use client';

import {
  PublicKeyText,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@baskt/ui';
import { OpenOrdersTabProps } from '../../../../types/baskt/trading/components/tabs';

export function OpenOrdersTab({ orders, onCancelOrder }: OpenOrdersTabProps) {
  return (
    <div className="overflow-x-auto -mt-4 -ml-2">
      <Table>
        <TableHeader className="bg-zinc-900">
          <TableRow>
            <TableHead className="p-2 h-8 text-text">Time</TableHead>
            <TableHead className="p-2 h-8 text-text">Order ID</TableHead>
            <TableHead className="p-2 h-8 text-text">Type</TableHead>
            <TableHead className="p-2 h-8 text-text">Direction</TableHead>
            <TableHead className="p-2 h-8 text-text">Position Value</TableHead>
            <TableHead className="p-2 h-8 text-text">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-8 p-2 text-center text-muted-foreground">
                No open orders found
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order: any, index) => (
              <TableRow key={index}>
                <TableCell className="p-2">{new Date(order.createdAt).toLocaleString()}</TableCell>
                <TableCell className="p-2">
                  <PublicKeyText publicKey={order.orderId?.toString() || ''} />
                </TableCell>
                <TableCell className="p-2">
                  <span className="text-blue-500">{order.orderType}</span>
                </TableCell>
                <TableCell className="p-2">
                  {order.orderAction === 'CLOSE' ? (
                    <span className="text-red-500">Close</span>
                  ) : (
                    <span
                      className={order.direction === 'Long' ? 'text-green-500' : 'text-red-500'}
                    >
                      {order.direction}
                    </span>
                  )}
                </TableCell>
                <TableCell className="p-2">
                  {order.sizeAsContracts ? Number(order.sizeAsContracts) / 1e4 : 0}
                </TableCell>
                <TableCell className="p-2">
                  <button
                    onClick={() => onCancelOrder(orders[index])}
                    className="text-xs px-2 py-1 bg-red-500/20 text-red-500 rounded hover:bg-red-500/30 transition-colors"
                  >
                    Cancel
                  </button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
