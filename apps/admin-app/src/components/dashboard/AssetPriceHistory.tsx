'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@baskt/ui';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PaginationControls,
  Input,
  Label,
  PublicKeyText,
} from '@baskt/ui';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { trpc } from '../../utils/trpc';
import { AssetPriceHistoryPageProps, FetchParams } from '../../types/assets';
import { getDefaultDateRange, getTimestampFromDate } from '../../utils/date';
import { getPaginatedData, getTotalPages } from '../../utils/pagination';
import { PriceHistoryTable } from '../assets/assetsHistory/PriceHistoryTable';

const PAGE_SIZE = 20;

const AssetPriceHistoryPage: React.FC<AssetPriceHistoryPageProps> = ({
  assetAddress,
  assetName,
  assetLogo,
  ticker,
  onBack,
}) => {
  const [range, setRange] = useState(getDefaultDateRange());
  const [all, setAll] = useState(false);
  const [page, setPage] = useState(0);

  const { startTimestamp, endTimestamp } = useMemo(
    () => ({
      startTimestamp: all ? 0 : getTimestampFromDate(range.start),
      endTimestamp: all ? getTimestampFromDate(new Date()) : getTimestampFromDate(range.end),
    }),
    [range, all],
  );

  const [fetchParams, setFetchParams] = useState<FetchParams | null>(null);

  const {
    data: prices,
    isLoading,
    error,
    refetch,
  } = trpc.assetPrice.getAssetPrice.useQuery(
    fetchParams ?? {
      assetId: '',
      startDate: 0,
      endDate: 0,
    },
    {
      enabled: !!fetchParams,
    },
  );

  const paginatedData = useMemo(() => {
    if (!fetchParams || !prices || !Array.isArray(prices)) return [];
    return getPaginatedData(prices, page, PAGE_SIZE);
  }, [prices, page, fetchParams]);

  const totalPages = useMemo(() => {
    if (!fetchParams || !prices || !Array.isArray(prices)) return 1;
    return getTotalPages(prices.length, PAGE_SIZE);
  }, [prices, fetchParams]);

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
  }, [fetchParams, refetch]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-4">
            {assetLogo && (
              <img
                src={assetLogo}
                alt={assetName}
                className="w-12 h-12 rounded-full border border-white/10"
              />
            )}
            <div>
              <h2 className="text-2xl font-bold text-white">
                {assetName} {ticker && <span className="text-sm text-white/60">({ticker})</span>}
              </h2>
              <div className="text-sm text-white/60">
                Address: <PublicKeyText publicKey={assetAddress} noFormat={true} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => refetch()}
            variant="outline"
            className="flex items-center gap-2 border border-white/10 bg-white/10 text-white hover:bg-white/20"
          >
            <RefreshCw className={`h-4 w-4`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Price History Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[300px]">
              <Label className="text-white">Date Range</Label>
              <div className="flex items-end gap-2 mt-1">
                <Input
                  type="date"
                  value={
                    range.start instanceof Date && !isNaN(range.start.getTime())
                      ? range.start.toISOString().slice(0, 10)
                      : ''
                  }
                  onChange={(e) => handleRangeChange(e, 'start')}
                  disabled={all}
                  className="border-white/10 text-white w-40"
                />
                <span className="text-white/60 pb-1">to</span>
                <Input
                  type="date"
                  value={
                    range.end instanceof Date && !isNaN(range.end.getTime())
                      ? range.end.toISOString().slice(0, 10)
                      : ''
                  }
                  onChange={(e) => handleRangeChange(e, 'end')}
                  disabled={all}
                  className="border-white/10 text-white w-40"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 px-2 py-2">
              <input
                type="checkbox"
                checked={all}
                onChange={handleAllChange}
                id="all-prices"
                className="accent-blue-500 h-5 w-5"
              />
              <Label htmlFor="all-prices" className="text-white">
                All Time
              </Label>
            </div>

            <Button
              onClick={handleFetch}
              className="h-10 bg-blue-500 text-white hover:bg-blue-500/90"
            >
              Fetch Prices
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Price History</CardTitle>
          {fetchParams && (
            <span className="text-sm text-white/60">
              Showing {paginatedData.length} of {prices?.data?.length || 0} price records
            </span>
          )}
        </CardHeader>
        <CardContent>
          <PriceHistoryTable
            data={paginatedData}
            isLoading={isLoading}
            error={error as Error | null}
          />

          {!isLoading && !error && paginatedData.length > 0 && (
            <div className="mt-4">
              <PaginationControls
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export { AssetPriceHistoryPage };
