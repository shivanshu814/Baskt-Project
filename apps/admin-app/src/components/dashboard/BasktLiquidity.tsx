import React from 'react';
import { Button } from '@baskt/ui';
import { RefreshCw } from 'lucide-react';
import { PoolInitializationForm } from '../pool/PoolInitializationForm';
import { PoolInformation } from '../pool/PoolInformation';
import { PoolParticipants } from '../pool/PoolParticipants';
import { StatCard } from '../pool/StatCard';
import { usePool } from '../../hooks/pool/usePool';
import { POOL_STATS } from '../../constants/pool';

export function LiquidityPoolManagement() {
  const {
    isInitialized,
    poolData,
    isRefetching,
    refetch,
    formData,
    formErrors,
    handleInputChange,
    validateForm,
    isLoading,
    initializePool,
    paginatedParticipants,
    totalPages,
    currentPage,
    pageSize,
    handlePageChange,
    handlePageSizeChange,
  } = usePool({
    onInitializationSuccess: () => refetch(),
  });

  const stats = React.useMemo(
    () =>
      POOL_STATS.map((stat) => ({
        ...stat,
        value: poolData?.[stat.key] || '0',
      })),
    [poolData],
  );

  const handleInitialize = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      return;
    }
    await initializePool(formData);
  };

  if (isRefetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center justify-center px-4 py-4">
      <div className="w-full flex flex-col gap-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Baskt Liquidity Pool</h1>
              <p className="text-white/60 text-sm mt-1">Configure and monitor the liquidity pool</p>
            </div>
          </div>
          {isInitialized && (
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="flex items-center gap-2 border border-white/10 bg-white/10 text-white hover:bg-white/20"
              disabled={isRefetching}
            >
              <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </div>

        {!isInitialized ? (
          <PoolInitializationForm
            formData={formData}
            formErrors={formErrors}
            isLoading={isLoading}
            onInputChange={handleInputChange}
            onSubmit={handleInitialize}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <StatCard
                  key={index}
                  label={stat.label}
                  value={stat.value}
                  subtext={stat.subtext}
                  tooltip={stat.tooltip}
                />
              ))}
            </div>

            <div className="grid grid-cols-1 gap-8">
              {poolData && <PoolInformation poolData={poolData} />}

              <PoolParticipants
                participants={paginatedParticipants}
                currentPage={currentPage}
                pageSize={pageSize}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
