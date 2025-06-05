'use client';

import { useRouter, useParams } from 'next/navigation';
import { BasktTradingForm } from '../../../components/baskt/details/BasktTradingForm';
import { IndexComposition } from '../../../components/baskt/details/IndexComposition';
import { SuggestedBaskts } from '../../../components/baskt/details/SuggestedBaskts';
import { ShareBasktModal } from '../../../components/baskt/details/ShareBasktModal';
import { CryptoNews } from '../../../components/baskt/details/CryptoNews';
import { Loading } from '../../../components/ui/loading';
import { Button } from '../../../components/ui/button';
import { useBasktDetail } from '../../../hooks/baskt/useBasktDetail';
import { BasktHeader } from '../../../components/baskt/details/BasktHeader';
import { BasktChart } from '../../../components/baskt/details/BasktChart';
import { BasktPosition } from '../../../components/baskt/details/BasktPosition';
import { suggestedBaskts } from '../../../data/suggested-baskts';

export default function BasktDetailPage() {
  const router = useRouter();
  const params = useParams();
  const basktId = params.id as string;

  const {
    baskt,
    userPosition,
    isLoading,
    isShareModalOpen,
    setIsShareModalOpen,
    chartPeriod,
    setChartPeriod,
    chartType,
    setChartType,
    cryptoNews,
  } = useBasktDetail(basktId);

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

  const userPositionFixed =
    userPosition && userPosition.type
      ? userPosition
      : userPosition
      ? { ...userPosition, type: 'long' as const }
      : null;

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      <div className="space-y-6 animate-fade-in p-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-3 space-y-6">
            <BasktHeader baskt={baskt} onShareClick={() => setIsShareModalOpen(true)} />
            <SuggestedBaskts suggestedBaskts={suggestedBaskts} />
          </div>

          <div className="col-span-6 space-y-6">
            <BasktChart
              baskt={baskt}
              chartPeriod={chartPeriod}
              setChartPeriod={setChartPeriod}
              chartType={chartType}
              setChartType={setChartType}
              onCompositionClick={() => scrollToSection('composition-section')}
              onPositionClick={() => scrollToSection('position-section')}
            />

            <div id="composition-section">
              <IndexComposition assets={baskt.assets} />
            </div>

            <div id="position-section">
              <BasktPosition userPosition={userPositionFixed} />
            </div>
          </div>

          <div className="col-span-3 space-y-6">
            <BasktTradingForm baskt={baskt} userPosition={userPositionFixed} />
            <CryptoNews news={cryptoNews} />
          </div>
        </div>
      </div>

      <ShareBasktModal
        isOpen={isShareModalOpen}
        onOpenChange={setIsShareModalOpen}
        basktName={baskt.name}
        basktPrice={baskt.price}
      />
    </div>
  );
}
