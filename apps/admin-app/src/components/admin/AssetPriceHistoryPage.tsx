import React, { useState, useMemo, useEffect } from 'react';
import { trpc } from '../../utils/trpc';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface AssetPriceHistoryPageProps {
  assetAddress: string;
  assetName: string;
  assetLogo?: string;
  ticker?: string;
  onBack?: () => void;
}

const PAGE_SIZE = 20;

function getDefaultDateRange() {
  const now = new Date();
  const end = now;
  const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // default: past 7 days
  return { start, end };
}

export const AssetPriceHistoryPage: React.FC<AssetPriceHistoryPageProps> = ({
  assetAddress,
  assetName,
  assetLogo,
  ticker,
  onBack,
}) => {
  const [range, setRange] = useState(getDefaultDateRange());
  const [all, setAll] = useState(false);
  const [page, setPage] = useState(0);

  // Memoize start/end timestamps
  const { startTimestamp, endTimestamp } = useMemo(() => {
    return {
      startTimestamp: all ? 0 : Math.floor(range.start.getTime() / 1000),
      endTimestamp: all ? Math.floor(Date.now() / 1000) : Math.floor(range.end.getTime() / 1000),
    };
  }, [range, all]);

  const [fetchParams, setFetchParams] = useState<any | null>(null);
  const { data: prices, isLoading, error, refetch } = trpc.assetPrice.getAssetPrice.useQuery(fetchParams ?? {}, {
    enabled: !!fetchParams,
  });

  // Pagination logic
  const paginatedData = useMemo(() => {
    if (!fetchParams || !prices || !Array.isArray(prices)) return [];
    const start = page * PAGE_SIZE;
    return prices.slice(start, start + PAGE_SIZE);
  }, [prices, page, fetchParams]);

  const totalPages = useMemo(() => {
    if (!fetchParams || !prices || !Array.isArray(prices)) return 1;
    return Math.ceil(prices.length / PAGE_SIZE);
  }, [prices, fetchParams]);

  // Handlers
  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end') => {
    setRange((prev) => ({
      ...prev,
      [type]: new Date(e.target.value),
    }));
    setPage(0);
  };

  const handleAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAll(e.target.checked);
    setPage(0);
  };

  const handleFetch = () => {
    setFetchParams({
      assetId: assetAddress,
      startDate: startTimestamp,
      endDate: endTimestamp,
    });
    setPage(0);
  };

  useEffect(() => {
    if (fetchParams) refetch();
  }, [fetchParams])

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Card className="mb-6 p-4 flex items-center gap-4">
        {assetLogo && <img src={assetLogo} alt={assetName} className="w-12 h-12 rounded-full" />}
        <div>
          <div className="font-bold text-lg">{assetName} {ticker && <span className="text-sm text-gray-400">({ticker})</span>}</div>
          <div className="text-xs text-gray-400">Address: <span className="font-mono">{assetAddress}</span></div>
        </div>
      </Card>
      <div className="flex flex-row items-end gap-4 mb-4 justify-start">
        <div className="flex flex-col items-start">
          <Label>Date Range</Label>
          <div className="flex flex-row items-end gap-2">
            <Input
              type="date"
              value={range.start instanceof Date && !isNaN(range.start.getTime()) ? range.start.toISOString().slice(0, 10) : ''}
              onChange={(e) => handleRangeChange(e, 'start')}
              disabled={all}
            />
            <span className="self-end pb-1">to</span>
            <Input
              type="date"
              value={range.end instanceof Date && !isNaN(range.end.getTime()) ? range.end.toISOString().slice(0, 10) : ''}
              onChange={(e) => handleRangeChange(e, 'end')}
              disabled={all}
            />
          </div>
        </div>
        <div className="flex flex-col items-start justify-end">
          <div className="flex items-center gap-2">
            <Input type="checkbox" checked={all} onChange={handleAllChange} id="all-prices" />
            <Label htmlFor="all-prices">All</Label>
          </div>
        </div>
        <Button onClick={handleFetch} className="h-10">Fetch</Button>
        {onBack && (
          <Button variant="outline" onClick={onBack} className="h-10">Back</Button>
        )}
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Raw Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                ) : error ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-red-500">
                    {error.message}
                  </TableCell>
                </TableRow>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center">No price data</TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row: any, i: number) => {
                // Handle date
                let dateStr = '-';
                if (row.time) {
                  const d = new Date(row.time * 1000);
                  dateStr = !isNaN(d.getTime()) ? d.toLocaleString() : '-';
                }
                return (
                  <TableRow key={i}>
                    <TableCell>{dateStr}</TableCell>
                    <TableCell>{row.price ?? '-'}</TableCell>
                    <TableCell>{row.rawPrice ?? '-'}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        {/* Pagination Controls */}
        <div className="flex justify-between items-center p-4">
          <Button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
            Prev
          </Button>
          <span>Page {page + 1} of {totalPages}</span>
          <Button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
            Next
          </Button>
        </div>
      </Card>
    </div>
  );
};
