import React from 'react';
import { useOpenOrders } from '../../../../../hooks/baskt/trade/useOpenOrders';
import { useOpenPositions } from '../../../../../hooks/baskt/trade/useOpenPositions';
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
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@baskt/ui';
import { useUSDCBalance } from '../../../../../hooks/pool/useUSDCBalance';
import { OrderType } from '@baskt/types';
import { BN } from 'bn.js';
import { toast } from 'sonner';
import { parseSolanaError } from '../../../../../utils/common/error-handling';
import { formatDateTime } from '../../../../../utils/common/date';
import { InfoIcon } from 'lucide-react';

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
                <TableHead className="text-xs sm:text-sm">Time</TableHead>
                <TableHead className="text-xs sm:text-sm">Type</TableHead>
                <TableHead className="text-xs sm:text-sm">Direction</TableHead>
                <TableHead className="text-xs sm:text-sm">Size</TableHead>
                <TableHead className="text-xs sm:text-sm">Price</TableHead>
                <TableHead className="text-xs sm:text-sm whitespace-nowrap">Limit Price</TableHead>
                <TableHead className="text-xs sm:text-sm underline decoration-dashed underline-offset-4 decoration-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="flex items-center gap-1 whitespace-nowrap">
                        Collateral <InfoIcon size={14} />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-xs">
                          Live collateral amount that can be adjusted
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!orders || orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-sm">You have no open orders.</p>
                      <p className="text-xs text-muted-foreground/70">
                        Market orders are filled immediately and appear in the Positions tab.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                // eslint-disable-next-line
                orders.map((order: any) => {
                  const positionSize = getPositionSizeForOrder(order);
                  return (
                    <TableRow key={order.orderId.toString()}>
                      <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                        {order.createOrder?.ts ? formatDateTime(order.createOrder.ts) : '-'}
                      </TableCell>
                      <TableCell className="font-medium text-xs sm:text-sm">
                        {order.orderType === OrderType.Market ? 'Market' : 'Limit'}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <span
                          className={`font-medium ${
                            order.isLong ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {order.isLong ? 'Long' : 'Short'}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        {positionSize ? (
                          <NumberFormat value={new BN(positionSize).toNumber() / 1e6} />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">Market</TableCell>
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
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="px-3 py-1.5 h-auto text-xs border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors"
                          disabled={!userUSDCAccount?.address}
                          onClick={() => {
                            if (!userUSDCAccount?.address) return;
                            cancelOrder(order);
                          }}
                        >
                          Cancel
                        </Button>
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
