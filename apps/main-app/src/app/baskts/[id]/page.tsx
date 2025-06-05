'use client';

import { useRouter, useParams } from 'next/navigation';
import { BasktTradingForm } from '../../../components/baskt/details/BasktTradingForm';
import { CryptoNews } from '../../../components/baskt/details/CryptoNews';
import { Loading } from '../../../components/ui/loading';
import { Button } from '../../../components/ui/button';
import { useBasktDetail } from '../../../hooks/baskt/useBasktDetail';
import { BasktChart } from '../../../components/baskt/details/BasktChart';
import { BasktTabs } from '../../../components/baskt/details/BasktTabs';

export default function BasktDetailPage() {
  const router = useRouter();
  const params = useParams();
  const basktId = params.id as string;

  const {
    baskt,
    userPosition,
    isLoading,
    chartPeriod,
    setChartPeriod,
    chartType,
    setChartType,
    cryptoNews,
  } = useBasktDetail(basktId);

  const userPositionFixed =
    userPosition && userPosition.type
      ? userPosition
      : userPosition
      ? { ...userPosition, type: 'long' as const }
      : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    );
  }

  if (!baskt) {
    return (
      <div>
        <div className="flex flex-col items-center justify-center h-[50vh]">
          <h2 className="text-2xl font-bold mb-2">Baskt not found</h2>
          <p className="text-muted-foreground mb-4">
            The baskt you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => router.push('/baskts')}>Back to Baskts</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-6 animate-fade-in p-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-9 space-y-9">
            <BasktChart
              baskt={baskt}
              chartPeriod={chartPeriod}
              setChartPeriod={setChartPeriod}
              chartType={chartType}
              setChartType={setChartType}
              onBasktChange={(id) => router.push(`/baskts/${id}`)}
            />

            <BasktTabs baskt={baskt} userPosition={userPositionFixed} />
          </div>

          <div className="col-span-3 space-y-6">
            <BasktTradingForm baskt={baskt} userPosition={userPositionFixed} />
            <CryptoNews news={cryptoNews} />
          </div>
        </div>
      </div>
    </div>
  );
}
