import {
  NumberFormat,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useUser,
} from '@baskt/ui';
import { usePositionHistory } from '../../../../hooks/trade/action/position-history/getPositionHistory';
import { PositionHistoryTabProps } from '../../../../types/baskt/trading/components/tabs';

export function PositionHistoryTab({ baskt }: PositionHistoryTabProps) {
  const { userAddress } = useUser();
  const { history, isLoading, isError, error } = usePositionHistory(baskt?.basktId, userAddress);

  console.log('Position History:', history);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading position history...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error loading position history: {error?.message}</p>
      </div>
    );
  }

  const hasPositions = history && history.length > 0;

  return (
    <div className="overflow-x-auto -mt-4 -ml-2">
      <Table>
        <TableHeader className="bg-zinc-900">
          <TableRow>
            <TableHead className="p-2 h-8 text-text">Entry Time</TableHead>
            <TableHead className="p-2 h-8 text-text">Direction</TableHead>
            <TableHead className="p-2 h-8 text-text">Position Size</TableHead>
            <TableHead className="p-2 h-8 text-text">Entry Price</TableHead>
            <TableHead className="p-2 h-8 text-text">Exit Price</TableHead>
            <TableHead className="p-2 h-8 text-text">Status</TableHead>
            <TableHead className="p-2 h-8 text-text">Total PnL</TableHead>
            <TableHead className="p-2 h-8 text-text">Total Fees</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!hasPositions ? (
            <TableRow>
              <TableCell colSpan={8} className="py-8 p-2 text-center text-muted-foreground">
                No position history found
              </TableCell>
            </TableRow>
          ) : (
            history.map((position: any, index: number) => {
              const formatTime = (timestamp: number) => {
                const date = new Date(timestamp * 1000);
                return {
                  date: date.toLocaleDateString(),
                  time: date.toLocaleTimeString(),
                };
              };

              const { date: entryDateFormatted, time: entryTimeFormatted } = formatTime(
                Number(position.entryTime),
              );

              const isProfit = Number(position.totalPnl) >= 0;

              return (
                <TableRow key={index}>
                  <TableCell className="p-2">
                    <div className="text-xs">
                      <div className="">{entryDateFormatted}</div>
                      <div className="text-muted-foreground">{entryTimeFormatted}</div>
                    </div>
                  </TableCell>
                  <TableCell className="p-2">
                    <span className={position.isLong ? 'text-green-500' : 'text-red-500'}>
                      {position.isLong ? 'Long' : 'Short'}
                    </span>
                  </TableCell>
                  <TableCell className="p-2">
                    <NumberFormat
                      value={Number(position.size / 1e6)}
                      isPrice={false}
                      showCurrency={false}
                    />
                  </TableCell>
                  <TableCell className="p-2">
                    <NumberFormat
                      value={Number(position.entryPrice)}
                      isPrice={true}
                      showCurrency={true}
                    />
                  </TableCell>
                  <TableCell className="p-2">
                    <NumberFormat
                      value={Number(position.averageExitPrice)}
                      isPrice={true}
                      showCurrency={true}
                    />
                  </TableCell>
                  <TableCell className="p-2">
                    <span
                      className={position.status === 'CLOSED' ? 'text-green-500' : 'text-blue-500'}
                    >
                      {position.status}
                    </span>
                  </TableCell>
                  <TableCell className="p-2">
                    <span className={isProfit ? 'text-green-500' : 'text-red-500'}>
                      {isProfit ? '+' : ''}
                      <NumberFormat
                        value={Number(position.totalPnl / 100)}
                        isPrice={true}
                        showCurrency={true}
                      />
                    </span>
                  </TableCell>
                  <TableCell className="p-2">
                    <NumberFormat
                      value={Number(position.totalFees)}
                      isPrice={true}
                      showCurrency={true}
                    />
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
