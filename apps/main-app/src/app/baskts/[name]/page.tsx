'use client';

import { useParams } from 'next/navigation';
import { BasktTradingForm } from '../../../components/baskt/details/BasktTradingForm';
import { useBasktDetail } from '../../../hooks/baskt/useBasktDetail';
import { BasktChart } from '../../../components/baskt/details/BasktChart';
import { BasktTabs } from '../../../components/baskt/details/BasktTabs';
import { BasktDetailSkeleton } from '../../../components/baskt/details/BasktDetailSkeleton';

export default function BasktDetailPage() {
  const params = useParams();
  const basktName = decodeURIComponent(params.name as string);

  const { baskt, isLoading, chartPeriod, chartType } = useBasktDetail(basktName);

  if (isLoading || !baskt) {
    return <BasktDetailSkeleton />;
  }

  return (
    <div className="min-h-screen pl-4">
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          <div className="lg:col-span-8 xl:col-span-9 space-y-2">
            <BasktChart baskt={baskt} chartPeriod={chartPeriod} chartType={chartType} />
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
