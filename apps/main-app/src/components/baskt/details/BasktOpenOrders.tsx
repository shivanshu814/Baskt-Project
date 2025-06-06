import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { useOpenOrders } from '../../../hooks/baskt/trade/useOpenOrders';
import { useCancelOrder } from '../../../hooks/baskt/trade/useCancelOrder';
import { useBasktClient } from '@baskt/ui';
import { useUSDCBalance } from '../../../hooks/pool/useUSDCBalance';

export const BasktOpenOrders = ({ basktId }: { basktId: string }) => {
  const { client } = useBasktClient();
  const userAddress = client?.wallet?.address?.toString();
  const { data: orders = [], isLoading } = useOpenOrders(basktId, userAddress);
  const publicKey = client?.wallet?.address;
  const { account: userUSDCAccount } = useUSDCBalance(publicKey);
  const { cancelOrder, isLoading: isCancelling } = useCancelOrder();

  return (
    <Card className="rounded-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Open Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Collateral</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  {[...Array(6)].map((_, i) => (
                    <TableCell key={i} className="py-8" />
                  ))}
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.publicKey.toString()}>
                    <TableCell className="font-medium">
                      {order.account.isLong ? (order.account.action.open ? 'Limit Buy' : 'Limit Sell') : (order.account.action.open ? 'Market Buy' : 'Market Sell')}
                    </TableCell>
                    <TableCell>
                      {order.account.size ? (order.account.size.toNumber() / 1e6).toFixed(2) : '-'} Baskt
                    </TableCell>
                    <TableCell>
                      {order.account.collateral ? `$${(order.account.collateral.toNumber() / 1e6).toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell className="text-[#16C784]">
                      {order.account.status.pending ? 'Active' : order.account.status.filled ? 'Filled' : 'Cancelled'}
                    </TableCell>
                    <TableCell className="text-right">
                      {order.account.timestamp
                        ? new Date(order.account.timestamp.toNumber() * 1000).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        className="px-3 py-1 rounded bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-50"
                        disabled={isCancelling || !userUSDCAccount?.address}
                        onClick={() => {
                          if (!userUSDCAccount?.address) return;
                          cancelOrder({
                            orderPDA: order.publicKey.toString(),
                            orderIdNum: order.account.orderId.toString(),
                            ownerTokenAccount: userUSDCAccount.address.toString(),
                          });
                        }}
                      >
                        {isCancelling ? 'Closing...' : 'Close'}
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
