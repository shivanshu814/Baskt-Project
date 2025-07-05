import React from 'react';
import { useOpenOrders } from '../../../hooks/baskt/trade/useOpenOrders';
import { useOpenPositions } from '../../../hooks/baskt/trade/useOpenPositions';
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
  PRICE_PRECISION,
} from '@baskt/ui';
import { useUSDCBalance } from '../../../hooks/pool/useUSDCBalance';
import { OrderType } from '@baskt/types';
import { BN } from 'bn.js';
import { toast } from 'sonner';
import { parseSolanaError } from '../../../utils/error-handling';

export const BasktOpenOrders = ({ basktId }: { basktId: string }) => {
  const { client } = useBasktClient();
  const userAddress = client?.wallet?.address?.toString();
  const { orders = [], cancelOrder } = useOpenOrders(basktId, userAddress);
  const { positions = [] } = useOpenPositions(basktId, userAddress);
  const publicKey = client?.wallet?.address;
  const { account: userUSDCAccount } = useUSDCBalance(publicKey);

  const calculateUsdcSize = (size: string, entryPrice: string) => {
    try {
      const sizeBN = new BN(size);
      const priceBN = new BN(entryPrice);
      return sizeBN.mul(priceBN).div(new BN(PRICE_PRECISION));
    } catch (error) {
      const parsedError = parseSolanaError(error);
      toast.error(parsedError.message);
      return null;
    }
  };
  // eslint-disable-next-line
  const getPositionSizeForOrder = (order: any) => {
    if (order.status === 'FILLED' && order.action === 'OPEN' && order.position) {
      const position = positions.find(
        // eslint-disable-next-line
        (pos: any) => pos.positionPDA === order.position && pos.status === 'OPEN',
      );

      if (position) {
        return position.size || position.usdcSize || order.usdcSize;
      }
    }

    if (order.targetPosition) {
      const position = positions.find(
        // eslint-disable-next-line
        (pos: any) => pos.positionPDA === order.targetPosition && pos.status === 'OPEN',
      );

      if (position) {
        if (position.usdcSize) {
          return position.usdcSize;
        } else if (position.size && position.entryPrice) {
          const calculatedUsdcSize = calculateUsdcSize(position.size, position.entryPrice);
          return calculatedUsdcSize ? calculatedUsdcSize.toString() : order.usdcSize;
        }
        return position.size || order.usdcSize;
      }
    }

    if (order.orderPDA) {
      const position = positions.find(
        // eslint-disable-next-line
        (pos: any) => pos.openOrder === order.orderPDA && pos.status === 'OPEN',
      );

      if (position) {
        return position.size || position.usdcSize || order.usdcSize;
      }
    }

    if (order.usdcSize === '0' && positions.length > 0) {
      // eslint-disable-next-line
      const openPosition = positions.find((pos: any) => pos.status === 'OPEN');
      if (openPosition) {
        return openPosition.size || openPosition.usdcSize || order.usdcSize;
      }
    }

    return order.usdcSize;
  };

  return (
    <Card className="rounded-none border-0 shadow-none">
      <CardHeader className="p-0 mb-2">
        <CardTitle className="text-base sm:text-lg font-medium">Open Orders</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs sm:text-sm">Type</TableHead>
                <TableHead className="text-xs sm:text-sm">Size</TableHead>
                <TableHead className="text-xs sm:text-sm">Collateral</TableHead>
                <TableHead className="text-xs sm:text-sm">Limit Price</TableHead>
                <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!orders || orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <p className="text-muted-foreground text-sm">You have no open orders.</p>
                  </TableCell>
                </TableRow>
              ) : (
                // eslint-disable-next-line
                orders.map((order: any) => {
                  const positionSize = getPositionSizeForOrder(order);
                  return (
                    <TableRow key={order.orderId.toString()}>
                      <TableCell className="font-medium text-xs sm:text-sm">
                        {order.orderType === OrderType.Market ? 'Market' : 'Limit'}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        {positionSize ? (
                          <NumberFormat value={new BN(positionSize).toNumber() / 1e6} />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        {order.collateral ? (
                          <NumberFormat
                            value={new BN(order.collateral).toNumber()}
                            isPrice={true}
                          />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        {order.limitPrice ? (
                          <NumberFormat
                            value={new BN(order.limitPrice).toNumber()}
                            isPrice={true}
                          />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          className="px-2 py-1 rounded bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-50"
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
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
