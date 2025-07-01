'use client';

import { useRouter, useParams } from 'next/navigation';
import { BasktTradingForm } from '../../../components/baskt/details/BasktTradingForm';
import { Loading, Button } from '@baskt/ui';
import { useBasktDetail } from '../../../hooks/baskt/useBasktDetail';
import { BasktChart } from '../../../components/baskt/details/BasktChart';
import { BasktTabs } from '../../../components/baskt/details/BasktTabs';
import { useState } from 'react';

export default function BasktDetailPage() {
  const router = useRouter();
  const params = useParams();

  const [basktName, setBasktName] = useState(decodeURIComponent(params.name as string));

  const { baskt, isLoading, chartPeriod, chartType } = useBasktDetail(basktName);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    );
  }

  if (!baskt) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
        <h2 className="text-2xl font-bold mb-2">Baskt not found</h2>
        <p className="text-muted-foreground mb-4 text-center px-4">
          The baskt you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => router.push('/baskts')}>Back to Baskts</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pl-4">
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          <div className="lg:col-span-8 xl:col-span-9 space-y-2">
            <BasktChart
              baskt={baskt}
              chartPeriod={chartPeriod}
              chartType={chartType}
              onBasktChange={(name: string) => setBasktName(name)}
            />

            <BasktTabs baskt={baskt} />
          </div>

          <div className="lg:col-span-4 xl:col-span-3 space-y-6">
            <BasktTradingForm baskt={baskt} />
          </div>
        </div>
      </div>
    </div>
  );
}
