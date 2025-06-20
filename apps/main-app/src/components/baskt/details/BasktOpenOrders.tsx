import React from 'react';
import { useOpenOrders } from '../../../hooks/baskt/trade/useOpenOrders';
import {
  NumberFormat,
  useBasktClient,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@baskt/ui';
import { useUSDCBalance } from '../../../hooks/pool/useUSDCBalance';
import { OnchainOrder, OrderAction, OrderStatus } from '@baskt/types';
import { BN } from 'bn.js';

export const BasktOpenOrders = ({ basktId }: { basktId: string }) => {
  const { client } = useBasktClient();
  const userAddress = client?.wallet?.address?.toString();
  const { orders = [], cancelOrder } = useOpenOrders(basktId, userAddress);
  const publicKey = client?.wallet?.address;
  const { account: userUSDCAccount } = useUSDCBalance(publicKey);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Open Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Collateral</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!orders || orders.length === 0 ? (
                <TableRow>
                  {[...Array(6)].map((_, i) => (
                    <TableCell key={i} className="py-8" />
                  ))}
                </TableRow>
              ) : (
                orders.map((order: OnchainOrder) => (
                  <TableRow key={order.orderId.toString()}>
                    <TableCell className="font-medium">
                      {order.action === OrderAction.Open ? 'Open' : 'Close'}
                    </TableCell>
                    <TableCell>
                      {order.size ? (
                        <NumberFormat value={new BN(order.size).toNumber()} isPrice={true} />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {order.collateral ? (
                        <NumberFormat value={new BN(order.collateral).toNumber()} isPrice={true} />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-[#16C784]">
                      {order.status === OrderStatus.PENDING
                        ? 'Active'
                        : order.status === OrderStatus.FILLED
                        ? 'Filled'
                        : 'Cancelled'}
                    </TableCell>
                    <TableCell className="text-right">
                      {order.timestamp
                        ? new Date(new BN(order.timestamp).toNumber() * 1000).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        className="px-3 py-1 rounded bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-50"
                        disabled={!userUSDCAccount?.address}
                        onClick={() => {
                          if (!userUSDCAccount?.address) return;
                          cancelOrder(order);
                        }}
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
      </CardContent>
    </Card>
  );
};
