import React, { useState, useMemo, useEffect } from 'react';
import { trpc } from '../../utils/trpc';
import { AssetPriceHistoryPageProps, FetchParams } from '../../types/assets';
import { getDefaultDateRange, getTimestampFromDate } from '../../utils/date';
import { getPaginatedData, getTotalPages } from '../../utils/pagination';
import { AssetHeader } from '../assets/assetsHistory/AssetHeader';
import { FiltersSection } from '../assets/assetsHistory/FiltersSection';
import { PriceHistoryTable } from '../assets/assetsHistory/PriceHistoryTable';
import { PaginationControls } from '../ui/pagination-controls';

const PAGE_SIZE = 20;

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
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <AssetHeader
        assetName={assetName}
        assetAddress={assetAddress}
        assetLogo={assetLogo}
        ticker={ticker}
      />

      <FiltersSection
        range={range}
        all={all}
        onRangeChange={handleRangeChange}
        onAllChange={handleAllChange}
        onFetch={handleFetch}
        onBack={onBack}
      />

      <PriceHistoryTable data={paginatedData} isLoading={isLoading} error={error as Error | null} />

      {!isLoading && !error && paginatedData.length > 0 && (
        <PaginationControls currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
};
