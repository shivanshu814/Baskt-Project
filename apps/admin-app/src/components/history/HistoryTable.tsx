import React, { useMemo, useCallback } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { Loader2 } from 'lucide-react';
import { formatDate } from '../../utils/pool';
import { useCopyWithTimeout } from '../../hooks/useCopyWithTimeout';
import { getStatusColor, getActionColor } from '../../utils/orderUtils';
import { PublicKeyText } from '@baskt/ui';
import { HistoryTableProps } from '../../types/history';
import { getPnlColor, formatPnl, formatSize, formatCollateral } from '../../utils/historyUtils';

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
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
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
        'Time'
    ];

    const renderTypeIdCell = useCallback((item: any) => ( //eslint-disable-line
        <div className="flex flex-col gap-1">
            <Badge variant={item.type === 'order' ? 'default' : 'secondary'} className="w-fit">
                {item.type.toUpperCase()}
            </Badge>
            <p className="text-sm text-gray-300 cursor-pointer"
                onClick={() => handleCopy(item.type === 'order' ? item.orderId! : item.positionId!, `id-${item.id}`)}>
                <PublicKeyText
                    publicKey={item.type === 'order' ? item.orderId! : item.positionId!}
                    isCopy={true}
                    noFormat={true}
                />
            </p>
        </div>
    ), [handleCopy]);

    const renderBasktCell = useCallback((item: any) => ( //eslint-disable-line
        <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-gray-200">
                {item.basktName || 'Unknown'}
            </p>
            <p className="text-xs text-gray-500 cursor-pointer"
                onClick={() => handleCopy(item.basktId, `baskt-${item.id}`)}>
                <PublicKeyText publicKey={item.basktId} isCopy={true} />
            </p>
        </div>
    ), [handleCopy]);

    const renderUserCell = useCallback((item: any) => ( //eslint-disable-line
        <p className="text-sm text-gray-300 cursor-pointer"
            onClick={() => handleCopy(item.owner, `owner-${item.id}`)}>
            <PublicKeyText publicKey={item.owner} isCopy={true} />
        </p>
    ), [handleCopy]);

    const renderActionCell = useCallback((item: any) => ( //eslint-disable-line
        <p className="text-sm text-gray-200">{item.action}</p>
    ), []);

    const renderPositionCell = useCallback((item: any) => ( //eslint-disable-line
        <p className={`text-sm font-medium ${getActionColor(item.isLong)}`}>
            {item.isLong ? 'Long' : 'Short'}
        </p>
    ), []);

    const renderSizeCell = useCallback((item: any) => ( //eslint-disable-line
        <p className="text-sm text-gray-200">{formatSize(item.size)}</p>
    ), []);

    const renderCollateralCell = useCallback((item: any) => ( //eslint-disable-line
        <p className="text-sm text-gray-200">{formatCollateral(item.collateral)}</p>
    ), []);

    const renderStatusCell = useCallback((item: any) => ( //eslint-disable-line
        <p className={`text-sm font-medium ${getStatusColor(item.status)}`}>
            {item.status}
        </p>
    ), []);

    const renderPnlCell = useCallback((item: any) => ( //eslint-disable-line
        <p className={`text-sm font-medium ${getPnlColor(item.pnl)}`}>
            {formatPnl(item.pnl, item.pnlPercentage)}
        </p>
    ), []);

    const renderTimeCell = useCallback((item: any) => ( //eslint-disable-line
        <p className="text-sm text-gray-500">{formatDate(parseInt(item.timestamp))}</p>
    ), []);

    const cellRenderers = useMemo(() => [
        renderTypeIdCell,
        renderBasktCell,
        renderUserCell,
        renderActionCell,
        renderPositionCell,
        renderSizeCell,
        renderCollateralCell,
        renderStatusCell,
        renderPnlCell,
        renderTimeCell
    ], [
        renderTypeIdCell,
        renderBasktCell,
        renderUserCell,
        renderActionCell,
        renderPositionCell,
        renderSizeCell,
        renderCollateralCell,
        renderStatusCell,
        renderPnlCell,
        renderTimeCell
    ]);

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
                    <TableCell key={index}>
                        {renderer(item)}
                    </TableCell>
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
                <TableBody>
                    {tableContent}
                </TableBody>
            </Table>
        </div>
    );
};

export default HistoryTable; 