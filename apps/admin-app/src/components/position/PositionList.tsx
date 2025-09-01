import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  NumberFormat,
  PublicKeyText,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@baskt/ui';
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  History,
  Loader2,
  Scissors,
} from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import { usePositions } from '../../hooks/position/usePositions';
import { formatDate } from '../../utils/date';

const LoadingState: React.FC<{ colSpan: number }> = ({ colSpan }) => (
  <TableRow>
    <TableCell colSpan={colSpan} className="text-center py-12">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-gray-400 font-medium">Loading positions...</p>
        <p className="text-sm text-gray-500 whitespace-nowrap">
          Please wait while we fetch your data
        </p>
      </div>
    </TableCell>
  </TableRow>
);

const ErrorState: React.FC<{ error: string; colSpan: number }> = ({ error, colSpan }) => (
  <TableRow>
    <TableCell colSpan={colSpan} className="text-center py-12">
      <div className="flex flex-col items-center gap-3">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <p className="text-red-400 font-medium">Error loading positions</p>
        <p className="text-sm text-gray-500 whitespace-nowrap">{error}</p>
      </div>
    </TableCell>
  </TableRow>
);

const EmptyState: React.FC<{ colSpan: number }> = ({ colSpan }) => (
  <TableRow>
    <TableCell colSpan={colSpan} className="text-center py-12">
      <div className="flex flex-col items-center gap-2">
        <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
          <FileText className="w-6 h-6 text-gray-500" />
        </div>
        <p className="text-gray-400 font-medium">No positions found</p>
        <p className="text-sm text-gray-500 whitespace-nowrap">No active positions in the system</p>
      </div>
    </TableCell>
  </TableRow>
);

const PositionList = () => {
  const { positions, isLoading, error } = usePositions();
  const [expandedPositions, setExpandedPositions] = useState<Set<string>>(new Set());

  const positionCounts = useMemo(() => {
    const total = positions.length;
    const open = positions.filter((position: any) => position.status === 'OPEN').length;
    const partiallyClosed = positions.filter(
      (position: any) =>
        position.status === 'OPEN' &&
        position.partialCloseHistory &&
        position.partialCloseHistory.length > 0,
    ).length;
    return { total, open, partiallyClosed };
  }, [positions]);

  const tableHeaders = [
    'Position ID',
    'Owner',
    'Baskt ID',
    'Direction',
    'Size',
    'Collateral',
    'Entry Price',
    'Status',
    'Partial Closes',
    'Opened',
    'Actions',
  ];

  const renderPositionIdCell = useCallback(
    (position: any) => (
      <div className="text-sm font-medium text-gray-200 truncate cursor-pointer">
        <PublicKeyText publicKey={position.positionId} isCopy={true} noFormat={false} />
      </div>
    ),
    [],
  );

  const renderOwnerCell = useCallback(
    (position: any) => (
      <div className="text-sm text-gray-500 whitespace-nowrap cursor-pointer">
        <PublicKeyText publicKey={position.owner} isCopy={true} />
      </div>
    ),
    [],
  );

  const renderBasktIdCell = useCallback(
    (position: any) => (
      <div className="text-sm text-gray-200">
        <PublicKeyText publicKey={position.basktAddress} isCopy={true} />
      </div>
    ),
    [],
  );

  const renderDirectionCell = useCallback(
    (position: any) => (
      <div className={`text-sm font-medium ${position.isLong ? 'text-green-500' : 'text-red-500'}`}>
        {position.isLong ? 'Long' : 'Short'}
      </div>
    ),
    [],
  );

  const renderSizeCell = useCallback(
    (position: any) => (
      <div className="text-sm text-gray-200">
        <NumberFormat value={parseFloat((parseFloat(position.remainingSize) / 1e6).toFixed(2))} />
      </div>
    ),
    [],
  );

  const renderCollateralCell = useCallback(
    (position: any) => (
      <div className="text-sm text-gray-200">
        <NumberFormat
          value={parseFloat(parseFloat(position.remainingCollateral).toFixed(2))}
          isPrice={true}
          showCurrency={true}
        />
      </div>
    ),
    [],
  );

  const renderEntryPriceCell = useCallback(
    (position: any) => (
      <div className="text-sm text-gray-200">
        <NumberFormat
          value={parseFloat(position.entryPrice.toFixed(2))}
          isPrice={true}
          showCurrency={true}
        />
      </div>
    ),
    [],
  );

  const renderStatusCell = useCallback((position: any) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'OPEN':
          return 'text-green-500';
        case 'CLOSED':
          return 'text-gray-400';
        case 'LIQUIDATED':
          return 'text-red-500';
        default:
          return 'text-gray-400';
      }
    };

    return (
      <div className={`text-sm font-medium ${getStatusColor(position.status)}`}>
        {position.status}
      </div>
    );
  }, []);

  const renderPartialClosesCell = useCallback(
    (position: any) => {
      const partialCloses = position.partialCloseHistory || [];
      const hasPartialCloses = partialCloses.length > 0;

      return (
        <div className="text-sm">
          {hasPartialCloses ? (
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="text-xs bg-orange-100 text-orange-700 border-orange-200 whitespace-nowrap"
              >
                <Scissors className="w-3 h-3 mr-1" />
                {partialCloses.length} partial close{partialCloses.length > 1 ? 's' : ''}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newExpanded = new Set(expandedPositions);
                  if (newExpanded.has(position.positionPDA)) {
                    newExpanded.delete(position.positionPDA);
                  } else {
                    newExpanded.add(position.positionPDA);
                  }
                  setExpandedPositions(newExpanded);
                }}
                className="h-6 w-6 p-0"
              >
                {expandedPositions.has(position.positionPDA) ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>
          ) : (
            <span className="text-gray-500">-</span>
          )}
        </div>
      );
    },
    [expandedPositions],
  );

  const renderOpenedCell = useCallback(
    (position: any) => (
      <div className="text-sm text-gray-500 whitespace-nowrap">
        {position.openPosition?.ts ? formatDate(parseInt(position.openPosition.ts)) : '-'}
      </div>
    ),
    [],
  );

  const renderActionsCell = useCallback((position: any) => {
    const partialCloses = position.partialCloseHistory || [];
    const hasPartialCloses = partialCloses.length > 0;

    return (
      <div className="flex items-center gap-2">
        {hasPartialCloses && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <History className="w-4 h-4 mr-1" />
                History
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Partial Close History</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-800 rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-gray-400">Position Statistics</h4>
                    <div className="mt-2 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Original Size:</span>
                        <NumberFormat
                          value={parseFloat((parseFloat(position.size) / 1e6).toFixed(2))}
                        />
                      </div>
                      <div className="flex justify-between">
                        <span>Remaining Size:</span>
                        <NumberFormat
                          value={parseFloat((parseFloat(position.remainingSize) / 1e6).toFixed(2))}
                        />
                      </div>
                      <div className="flex justify-between">
                        <span>Total Closed:</span>
                        <NumberFormat
                          value={
                            partialCloses.length > 0
                              ? parseFloat(
                                  partialCloses
                                    .reduce(
                                      (sum: number, close: any) =>
                                        sum + parseFloat(close.closeAmount) / 1e6,
                                      0,
                                    )
                                    .toFixed(2),
                                )
                              : 0
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-400">PnL Summary</h4>
                    <div className="mt-2 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Total PnL:</span>
                        <NumberFormat
                          value={parseFloat(
                            partialCloses
                              .reduce(
                                (sum: number, close: any) =>
                                  sum + parseFloat(close.settlementDetails.pnl),
                                0,
                              )
                              .toFixed(2),
                          )}
                          isPrice={true}
                          showCurrency={true}
                        />
                      </div>
                      <div className="flex justify-between">
                        <span>Total Fees:</span>
                        <NumberFormat
                          value={parseFloat(
                            partialCloses
                              .reduce(
                                (sum: number, close: any) =>
                                  sum + parseFloat(close.settlementDetails.feeToTreasury),
                                0,
                              )
                              .toFixed(2),
                          )}
                          isPrice={true}
                          showCurrency={true}
                        />
                      </div>
                      <div className="flex justify-between">
                        <span>Total Closed:</span>
                        <NumberFormat
                          value={parseFloat(
                            partialCloses
                              .reduce(
                                (sum: number, close: any) => sum + parseFloat(close.closeAmount),
                                0,
                              )
                              .toFixed(2),
                          )}
                          isPrice={true}
                          showCurrency={true}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-400">Partial Close Transactions</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {partialCloses.map((close: any, index: number) => (
                      <div
                        key={index}
                        className="p-3 bg-gray-800 rounded-lg border border-gray-700"
                      >
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-gray-400">Size Closed:</span>
                              <NumberFormat
                                value={parseFloat((parseFloat(close.closeAmount) / 1e6).toFixed(2))}
                              />
                            </div>
                            <div className="flex justify-between mb-1">
                              <span className="text-gray-400">Exit Price:</span>
                              <NumberFormat
                                value={parseFloat(parseFloat(close.closePrice).toFixed(2))}
                                isPrice={true}
                                showCurrency={true}
                              />
                            </div>
                            <div className="flex justify-between mb-1">
                              <span className="text-gray-400">PnL:</span>
                              <span
                                className={
                                  parseFloat(close.settlementDetails.pnl) > 0
                                    ? 'text-green-500'
                                    : 'text-red-500'
                                }
                              >
                                <NumberFormat
                                  value={parseFloat(
                                    parseFloat(close.settlementDetails.pnl).toFixed(2),
                                  )}
                                  isPrice={true}
                                />
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-gray-400">Fees:</span>
                              <NumberFormat
                                value={parseFloat(close.settlementDetails.feeToTreasury.toFixed(2))}
                                isPrice={true}
                                showCurrency={true}
                              />
                            </div>
                            <div className="flex justify-between mb-1">
                              <span className="text-gray-400">Transaction:</span>
                              <span className="text-xs text-gray-400">
                                <PublicKeyText
                                  publicKey={close.closePosition.tx}
                                  isCopy={true}
                                  noFormat={false}
                                />
                              </span>
                            </div>
                            <div className="flex justify-between mb-1">
                              <span className="text-gray-400">Date:</span>
                              <span>{formatDate(parseInt(close.closePosition.ts))}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  }, []);

  const cellRenderers = useMemo(
    () => [
      renderPositionIdCell,
      renderOwnerCell,
      renderBasktIdCell,
      renderDirectionCell,
      renderSizeCell,
      renderCollateralCell,
      renderEntryPriceCell,
      renderStatusCell,
      renderPartialClosesCell,
      renderOpenedCell,
      renderActionsCell,
    ],
    [
      renderPositionIdCell,
      renderOwnerCell,
      renderBasktIdCell,
      renderDirectionCell,
      renderSizeCell,
      renderCollateralCell,
      renderEntryPriceCell,
      renderStatusCell,
      renderPartialClosesCell,
      renderOpenedCell,
      renderActionsCell,
    ],
  );

  const tableContent = useMemo(() => {
    if (isLoading) {
      return <LoadingState colSpan={tableHeaders.length} />;
    }

    if (error instanceof Error) {
      return <ErrorState error={error.message} colSpan={tableHeaders.length} />;
    }

    if (positions.length === 0) {
      return <EmptyState colSpan={tableHeaders.length} />;
    }

    return positions.map((position: any) => (
      <React.Fragment key={position.positionPDA}>
        <TableRow>
          {cellRenderers.map((renderer, index) => (
            <TableCell key={index}>{renderer(position)}</TableCell>
          ))}
        </TableRow>

        {expandedPositions.has(position.positionPDA) &&
          position.partialCloseHistory &&
          position.partialCloseHistory.length > 0 && (
            <TableRow>
              <TableCell colSpan={tableHeaders.length} className="p-0 whitespace-nowrap">
                <div className="bg-gray-800/50 p-4 border-t border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 ">
                    {position.partialCloseHistory.map((close: any, index: number) => (
                      <div key={index} className="p-3 bg-gray-700 rounded-lg">
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Closed:</span>
                            <NumberFormat
                              value={parseFloat((parseFloat(close.closeAmount) / 1e6).toFixed(2))}
                            />
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Price:</span>
                            <NumberFormat
                              value={parseFloat(parseFloat(close.closePrice).toFixed(2))}
                              isPrice={true}
                              showCurrency={true}
                            />
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">PnL:</span>
                            <span
                              className={
                                parseFloat(close.settlementDetails.pnl) > 0
                                  ? 'text-green-500'
                                  : 'text-red-500'
                              }
                            >
                              <NumberFormat
                                value={parseFloat(
                                  parseFloat(close.settlementDetails.pnl).toFixed(2),
                                )}
                                isPrice={true}
                              />
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Date:</span>
                            <span className="text-xs">
                              {formatDate(parseInt(close.closePosition.ts))}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TableCell>
            </TableRow>
          )}
      </React.Fragment>
    ));
  }, [positions, isLoading, error, cellRenderers, tableHeaders.length, expandedPositions]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mt-2 text-2xl font-bold text-white">Positions ({positionCounts.total})</h2>
          <p className="text-white/60 mt-1">
            Manage and monitor all positions in the system
            {positionCounts.partiallyClosed > 0 && (
              <span className="ml-2 text-orange-400">
                • {positionCounts.partiallyClosed} with partial closes
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="rounded-md border border-gray-700">
        <Table>
          <TableHeader>
            <TableRow>
              {tableHeaders.map((header, index) => (
                <TableHead key={index} className="whitespace-nowrap">
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>{tableContent}</TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PositionList;
