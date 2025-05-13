'use client';

import React from 'react';
import { Button } from '../components/ui/button';
import Link from 'next/link';
import { ArrowRight, BarChart3, LineChart, ShieldCheck } from 'lucide-react';
import { Footer } from '../components/Footer';
import { BasktCard } from '../components/baskt/BasktCard';
import { useMemo } from 'react';
import { trpc } from '../utils/trpc';
import { BasktInfo } from '@baskt/types';

const FEATURES = [
  {
    icon: BarChart3,
    title: 'Data-Driven Insights',
    description:
      'Leverage cutting-edge AI analytics to make informed decisions about market trends and opportunities.',
  },
  {
    icon: ShieldCheck,
    title: 'Risk Management',
    description:
      'Mitigate risk through diversified exposure while participating in high-growth sectors.',
  },
  {
    icon: LineChart,
    title: 'Active Management',
    description:
      'Stay ahead with expertly rebalanced indexes that adapt to evolving market narratives.',
  },
] as const;

export default function Homepage() {
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
              day: baskt.performance.daily,
              week: baskt.performance.weekly,
              month: baskt.performance.monthly,
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

  const renderFeatureCard = ({ icon: Icon, title, description }: (typeof FEATURES)[number]) => (
    <div className="bg-card rounded-xl p-6 text-center">
      <div className="bg-primary/10 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );

  const renderFeaturedBaskts = () => {
    if (isLoading) {
      return (
        <div className="text-center py-16">
          <p className="text-muted-foreground">Loading featured baskts...</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {featuredBaskts.map((baskt) => (
          <BasktCard
            key={String(baskt.basktId)}
            baskt={baskt}
            className="hover:shadow-md transition-shadow"
          />
        ))}
      </div>
    );
  };

  return (
    <div>
      <section className="bg-gradient-to-b from-primary/10 to-background pt-16 pb-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Trade Optimized <span className="text-primary">Baskts</span> of Crypto Assets
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Expertly curated crypto index products aligned with high-growth trends, from AI to DeFi
            and beyond.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/baskts">
                Explore Baskts
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/how-it-works">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Baskt?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map((feature) => (
              <React.Fragment key={feature.title}>
                {renderFeatureCard(feature)}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Featured Baskts</h2>
            <Button variant="outline" asChild>
              <Link href="/baskts">View All</Link>
            </Button>
          </div>
          {renderFeaturedBaskts()}
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Trading?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of investors who are already using Baskt to simplify their crypto
            journey.
          </p>
          <Button size="lg" asChild>
            <Link href="/baskts">
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
