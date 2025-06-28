import React, { useMemo, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  PublicKeyText,
} from '@baskt/ui';
import { Loader2, FileText } from 'lucide-react';
import { formatDate } from '../../utils/pool';
import { useCopyWithTimeout } from '../../hooks/useCopyWithTimeout';
import { getStatusColor, getActionColor } from '../../utils/orderUtils';
import { HistoryTableProps } from '../../types/history';
import { getPnlColor, formatSize } from '../../utils/historyUtils';
import { NumberFormat } from '@baskt/ui';

const LoadingState: React.FC<{ colSpan: number }> = ({ colSpan }) => (
  <TableRow>
    <TableCell colSpan={colSpan} className="text-center py-12">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-gray-400 font-medium">Loading history...</p>
        <p className="text-sm text-gray-500">Please wait while we fetch your data</p>
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
        <p className="text-gray-400 font-medium">No history found</p>
        <p className="text-sm text-gray-500">Try adjusting your filters or check back later</p>
      </div>
    </TableCell>
  </TableRow>
);

const HistoryTable: React.FC<HistoryTableProps> = ({ history, isLoading }) => {
  const { handleCopy } = useCopyWithTimeout();

  const tableHeaders = [
    'Type / ID',
    'Baskt',
    'User',
    'Action',
    'Position',
    'Size',
    'Collateral',
    'Status',
    'PnL',
    'Time',
  ];

  const renderTypeIdCell = useCallback(
    (
      item: any, //eslint-disable-line
    ) => (
      <div className="flex flex-col gap-1">
        <Badge variant={item.type === 'order' ? 'default' : 'secondary'} className="w-fit">
          {item.type.toUpperCase()}
        </Badge>
        <div
          className="text-sm text-gray-300 cursor-pointer"
          onClick={() =>
            handleCopy(item.type === 'order' ? item.orderId! : item.positionId!, `id-${item.id}`)
          }
        >
          <PublicKeyText
            publicKey={item.type === 'order' ? item.orderId! : item.positionId!}
            isCopy={true}
            noFormat={true}
          />
        </div>
      </div>
    ),
    [handleCopy],
  );

  const renderBasktCell = useCallback(
    (
      item: any, //eslint-disable-line
    ) => (
      <div className="flex flex-col gap-1">
        <div className="text-sm font-medium text-gray-200">{item.basktName || 'Unknown'}</div>
        <div
          className="text-xs text-gray-500 cursor-pointer"
          onClick={() => handleCopy(item.basktId, `baskt-${item.id}`)}
        >
          <PublicKeyText publicKey={item.basktId} isCopy={true} />
        </div>
      </div>
    ),
    [handleCopy],
  );

  const renderUserCell = useCallback(
    (
      item: any, //eslint-disable-line
    ) => (
      <div
        className="text-sm text-gray-300 cursor-pointer"
        onClick={() => handleCopy(item.owner, `owner-${item.id}`)}
      >
        <PublicKeyText publicKey={item.owner} isCopy={true} />
      </div>
    ),
    [handleCopy],
  );

  const renderActionCell = useCallback(
    (
      item: any, //eslint-disable-line
    ) => <div className="text-sm text-gray-200">{item.action}</div>,
    [],
  );

  const renderPositionCell = useCallback(
    (
      item: any, //eslint-disable-line
    ) => (
      <div className={`text-sm font-medium ${getActionColor(item.isLong)}`}>
        {item.isLong ? 'Long' : 'Short'}
      </div>
    ),
    [],
  );

  const renderSizeCell = useCallback(
    (
      item: any, //eslint-disable-line
    ) => <div className="text-sm text-gray-200">{formatSize(item.size)}</div>,
    [],
  );

  const renderCollateralCell = useCallback(
    (
      item: any, //eslint-disable-line
    ) => (
      <div className="text-sm text-gray-200">
        {item.collateral ? <NumberFormat value={parseFloat(item.collateral)} isPrice /> : '-'}
      </div>
    ),
    [],
  );

  const renderStatusCell = useCallback(
    (
      item: any, //eslint-disable-line
    ) => <div className={`text-sm font-medium ${getStatusColor(item.status)}`}>{item.status}</div>,
    [],
  );

  const renderPnlCell = useCallback(
    (
      item: any, //eslint-disable-line
    ) => (
      <div className={`text-sm font-medium ${getPnlColor(item.pnl)}`}>
        {item.pnl ? (
          <>
            <NumberFormat value={parseFloat(item.pnl)} isPrice />
            {item.pnlPercentage && ` (${item.pnlPercentage}%)`}
          </>
        ) : (
          '-'
        )}
      </div>
    ),
    [],
  );

  const renderTimeCell = useCallback(
    (
      item: any, //eslint-disable-line
    ) => <div className="text-sm text-gray-500">{formatDate(parseInt(item.timestamp))}</div>,
    [],
  );

  const cellRenderers = useMemo(
    () => [
      renderTypeIdCell,
      renderBasktCell,
      renderUserCell,
      renderActionCell,
      renderPositionCell,
      renderSizeCell,
      renderCollateralCell,
      renderStatusCell,
      renderPnlCell,
      renderTimeCell,
    ],
    [
      renderTypeIdCell,
      renderBasktCell,
      renderUserCell,
      renderActionCell,
      renderPositionCell,
      renderSizeCell,
      renderCollateralCell,
      renderStatusCell,
      renderPnlCell,
      renderTimeCell,
    ],
  );

  const tableContent = useMemo(() => {
    if (isLoading) {
      return <LoadingState colSpan={tableHeaders.length} />;
    }

    if (history.length === 0) {
      return <EmptyState colSpan={tableHeaders.length} />;
    }

    return history.map((item) => (
      <TableRow key={item.id}>
        {cellRenderers.map((renderer, index) => (
          <TableCell key={index}>{renderer(item)}</TableCell>
        ))}
      </TableRow>
    ));
  }, [history, isLoading, cellRenderers, tableHeaders.length]);

  return (
    <div className="rounded-md border border-gray-700">
      <Table>
        <TableHeader>
          <TableRow>
            {tableHeaders.map((header, index) => (
              <TableHead key={index}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>{tableContent}</TableBody>
      </Table>
    </div>
  );
};

export default HistoryTable;
