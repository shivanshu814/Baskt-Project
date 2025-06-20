import React, { useMemo, useCallback } from 'react';
import { usePositions } from '../../hooks/usePositions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  NumberFormat,
  PublicKeyText,
} from '@baskt/ui';
import { formatDate } from '../../utils/date';
import { PositionStatus } from '@baskt/types';
import { Loader2, AlertCircle } from 'lucide-react';

const LoadingState: React.FC<{ colSpan: number }> = ({ colSpan }) => (
  <TableRow>
    <TableCell colSpan={colSpan} className="text-center py-12">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-gray-400 font-medium">Loading positions...</p>
        <p className="text-sm text-gray-500">Please wait while we fetch your data</p>
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
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    </TableCell>
  </TableRow>
);

const EmptyState: React.FC<{ colSpan: number }> = ({ colSpan }) => (
  <TableRow>
    <TableCell colSpan={colSpan} className="text-center py-12">
      <div className="flex flex-col items-center gap-2">
        <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
          <svg
            className="w-6 h-6 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <p className="text-gray-400 font-medium">No positions found</p>
        <p className="text-sm text-gray-500">No active positions in the system</p>
      </div>
    </TableCell>
  </TableRow>
);

const PositionList = () => {
  const { data: positions = [], isLoading, error } = usePositions();

  const tableHeaders = [
    'Position ID',
    'Owner',
    'Baskt ID',
    'Direction',
    'Size',
    'Collateral',
    'Entry Price',
    'Exit Price',
    'Status',
    'Opened',
    'Closed',
  ];

  const renderPositionIdCell = useCallback(
    (
      position: any, // eslint-disable-line
    ) => (
      <p className="text-sm font-medium text-gray-200 truncate cursor-pointer">
        <PublicKeyText publicKey={position.positionId.toString()} isCopy={true} noFormat={true} />
      </p>
    ),
    [],
  );

  const renderOwnerCell = useCallback(
    (
      position: any, // eslint-disable-line
    ) => (
      <p className="text-sm text-gray-500 cursor-pointer">
        <PublicKeyText publicKey={position.owner.toString()} isCopy={true} />
      </p>
    ),
    [],
  );

  const renderBasktIdCell = useCallback(
    (
      position: any, // eslint-disable-line
    ) => (
      <p className="text-sm text-gray-200">
        <PublicKeyText publicKey={position.basktId.toString()} isCopy={true} />
      </p>
    ),
    [],
  );

  const renderDirectionCell = useCallback(
    (
      position: any, // eslint-disable-line
    ) => (
      <p className={`text-sm font-medium ${position.isLong ? 'text-green-500' : 'text-red-500'}`}>
        {position.isLong ? 'Long' : 'Short'}
      </p>
    ),
    [],
  );

  const renderSizeCell = useCallback(
    (
      position: any, // eslint-disable-line
    ) => (
      <p className="text-sm text-gray-200">
        <NumberFormat value={position.size.toNumber()} isPrice={true} />
      </p>
    ),
    [],
  );

  const renderCollateralCell = useCallback(
    (
      position: any, // eslint-disable-line
    ) => (
      <p className="text-sm text-gray-200">
        <NumberFormat value={position.collateral.toNumber()} isPrice={true} />
      </p>
    ),
    [],
  );

  const renderEntryPriceCell = useCallback(
    (
      position: any, // eslint-disable-line
    ) => (
      <p className="text-sm text-gray-200">
        <NumberFormat value={position.entryPrice.toNumber()} isPrice={true} />
      </p>
    ),
    [],
  );

  const renderExitPriceCell = useCallback(
    (
      position: any, // eslint-disable-line
    ) => (
      <p className="text-sm text-gray-200">
        {position.closePosition?.exitPrice ? (
          <NumberFormat value={position.closePosition.exitPrice.toNumber()} isPrice={true} />
        ) : (
          <span className="text-gray-500">-</span>
        )}
      </p>
    ),
    [],
  );

  // eslint-disable-next-line
  const renderStatusCell = useCallback((position: any) => {
    const getStatusColor = (status: PositionStatus) => {
      switch (status) {
        case PositionStatus.OPEN:
          return 'text-green-500';
        case PositionStatus.CLOSED:
          return 'text-gray-400';
        case PositionStatus.LIQUIDATED:
          return 'text-red-500';
        default:
          return 'text-gray-400';
      }
    };

    return (
      <p className={`text-sm font-medium ${getStatusColor(position.status)}`}>{position.status}</p>
    );
  }, []);

  const renderOpenedCell = useCallback(
    (
      position: any, // eslint-disable-line
    ) => <p className="text-sm text-gray-500">{formatDate(position.timestampOpen.toNumber())}</p>,
    [],
  );

  const renderClosedCell = useCallback(
    (
      position: any, // eslint-disable-line
    ) => (
      <p className="text-sm text-gray-500">
        {position.closePosition?.ts ? formatDate(parseInt(position.closePosition.ts)) : '-'}
      </p>
    ),
    [],
  );

  const cellRenderers = useMemo(
    () => [
      renderPositionIdCell,
      renderOwnerCell,
      renderBasktIdCell,
      renderDirectionCell,
      renderSizeCell,
      renderCollateralCell,
      renderEntryPriceCell,
      renderExitPriceCell,
      renderStatusCell,
      renderOpenedCell,
      renderClosedCell,
    ],
    [
      renderPositionIdCell,
      renderOwnerCell,
      renderBasktIdCell,
      renderDirectionCell,
      renderSizeCell,
      renderCollateralCell,
      renderEntryPriceCell,
      renderExitPriceCell,
      renderStatusCell,
      renderOpenedCell,
      renderClosedCell,
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

    return positions.map((position) => (
      <TableRow key={position.address.toString()}>
        {cellRenderers.map((renderer, index) => (
          <TableCell key={index}>{renderer(position)}</TableCell>
        ))}
      </TableRow>
    ));
  }, [positions, isLoading, error, cellRenderers, tableHeaders.length]);

  return (
    <div className="mt-6 rounded-md border border-gray-700">
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

export default PositionList;
