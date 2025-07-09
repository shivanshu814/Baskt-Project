import { Button, Loading } from '@baskt/ui';
import Link from 'next/link';
import { BasktCards } from '../baskt/BasktCards';
import { BasktInfo } from '@baskt/types';
import { useMemo } from 'react';
import { trpc } from '../../utils/trpc';

export function FeaturedBaskts() {
  const { data: basktsData, isLoading } = trpc.baskt.getAllBaskts.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const featuredBaskts = useMemo(() => {
    if (!basktsData?.success || !('data' in basktsData) || !Array.isArray(basktsData.data))
      return [];

    const convertedBaskts = basktsData.data
      .filter((baskt): baskt is NonNullable<typeof baskt> => baskt !== null)
      .map((baskt) => ({
        ...baskt,
        performance: baskt.performance
          ? {
              day: (baskt.performance as any)?.day || baskt.performance.daily, //eslint-disable-line
              week: (baskt.performance as any)?.week || baskt.performance.weekly, //eslint-disable-line
              month: (baskt.performance as any)?.month || baskt.performance.monthly, //eslint-disable-line
              year: baskt.performance.year,
            }
          : undefined,
        creationDate: baskt?.creationDate ? new Date(baskt.creationDate) : new Date(),
        assets: baskt?.assets?.map((asset) => ({
          ...asset,
          weight: Number(asset.weight),
          weightage: Number(asset.weightage),
        })),
      })) as unknown as BasktInfo[];

    return convertedBaskts.slice(0, 4);
  }, [basktsData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading />
      </div>
    );
  }

  if (featuredBaskts.length === 0) {
    return (
      <div className="text-center py-16 bg-secondary/20 rounded-lg">
        <h3 className="text-xl font-medium mb-2">No baskts available</h3>
        <p className="text-muted-foreground mb-4">Check back soon for new featured baskts.</p>
      </div>
    );
  }

  return (
    <section className="py-16 bg-secondary/20">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Featured Baskts</h2>
          <Button variant="outline" asChild>
            <Link href="/baskts">View All</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredBaskts.map((baskt) => (
            <BasktCards
              key={String(baskt.basktId)}
              baskt={baskt}
              className="hover:shadow-md transition-shadow"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
