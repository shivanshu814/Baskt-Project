import React from 'react';
import { useOrderHistory } from '../../../hooks/baskt/trade/useOrderHistory';
import { useBasktClient } from '@baskt/ui';
import {
  NumberFormat,
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
import { OrderAction } from '@baskt/types';

export const BasktOrderHistory = ({ basktId }: { basktId?: string }) => {
  const { client } = useBasktClient();
  const userAddress = client?.wallet?.address?.toString();
  const { history, isLoading, error } = useOrderHistory(userAddress, basktId);

  const positionHistory = history?.filter((item) => item.type === 'position') || [];

  const getPnlColor = (pnl?: string) => {
    if (!pnl) return 'text-gray-500';
    const pnlValue = parseFloat(pnl);
    return pnlValue > 0 ? 'text-green-500' : pnlValue < 0 ? 'text-red-500' : 'text-gray-500';
  };

  const formatDate = (timestamp: string) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Card className="rounded-none border-0 shadow-none">
        <CardHeader className="p-0 mb-2">
          <CardTitle className="text-base sm:text-lg font-medium">Order History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">Loading history...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="rounded-none border-0 shadow-none">
        <CardHeader className="p-0 mb-2">
          <CardTitle className="text-base sm:text-lg font-medium">Order History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-center py-8">
            <p className="text-red-500 text-sm">Error loading order history: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-none border-0 shadow-none">
      <CardHeader className="p-0 mb-2">
        <CardTitle className="text-base sm:text-lg font-medium">Order History</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs sm:text-sm">Type</TableHead>
                <TableHead className="text-xs sm:text-sm">Size</TableHead>
                <TableHead className="text-xs sm:text-sm">Entry Price</TableHead>
                <TableHead className="text-xs sm:text-sm">Exit Price</TableHead>
                <TableHead className="text-xs sm:text-sm">PnL</TableHead>
                <TableHead className="text-right text-xs sm:text-sm">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!positionHistory || positionHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground text-sm">No order history found.</p>
                  </TableCell>
                </TableRow>
              ) : (
                positionHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-xs sm:text-sm">
                      {item.type === 'order'
                        ? item.action === OrderAction.Open
                          ? 'Open'
                          : 'Close'
                        : item.isLong
                        ? 'Long'
                        : 'Short'}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {item.size ? <NumberFormat value={parseFloat(item.size) / 1e6} /> : '-'}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {item.entryPrice ? (
                        <NumberFormat value={parseFloat(item.entryPrice)} isPrice />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {item.exitPrice ? (
                        <NumberFormat value={parseFloat(item.exitPrice)} isPrice />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className={`text-xs sm:text-sm ${getPnlColor(item.pnl)}`}>
                      {item.pnl ? (
                        <>
                          <NumberFormat value={parseFloat(item.pnl)} isPrice />
                          {item.pnlPercentage && ` (${item.pnlPercentage}%)`}
                        </>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs sm:text-sm">
                      {formatDate(item.timestamp)}
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
