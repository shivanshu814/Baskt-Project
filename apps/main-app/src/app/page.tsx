'use client';

import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import Link from 'next/link';
import { ArrowRight, BarChart3, LineChart, ShieldCheck } from 'lucide-react';
import { Footer } from '../components/Footer';
import { BasktCard } from '../components/baskt/BasktCard';
import { useState, useEffect } from 'react';
import { Baskt } from '../types/baskt';

export default function Homepage() {
  const [featuredBaskts, setFeaturedBaskts] = useState<Baskt[]>([]);

  useEffect(() => {
    // TODO: Replace with actual API call to fetch featured baskts
    const fetchFeaturedBaskts = async () => {
      try {
        // const response = await fetch('/api/baskts/featured');
        // const data = await response.json();
        // setFeaturedBaskts(data);
        setFeaturedBaskts([]); // Empty array for now
      } catch (error) {
        console.error('Error fetching featured baskts:', error); //eslint-disable-line
        setFeaturedBaskts([]);
      }
    };

    fetchFeaturedBaskts();
  }, []);

  return (
    <Layout className="p-0 md:p-0">
      {/* Hero Section */}
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

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Baskt?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card rounded-xl p-6 text-center">
              <div className="bg-primary/10 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Data-Driven Insights</h3>
              <p className="text-muted-foreground">
                Leverage cutting-edge AI analytics to make informed decisions about market trends
                and opportunities.
              </p>
            </div>
            <div className="bg-card rounded-xl p-6 text-center">
              <div className="bg-primary/10 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Risk Management</h3>
              <p className="text-muted-foreground">
                Mitigate risk through diversified exposure while participating in high-growth
                sectors.
              </p>
            </div>
            <div className="bg-card rounded-xl p-6 text-center">
              <div className="bg-primary/10 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <LineChart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Active Management</h3>
              <p className="text-muted-foreground">
                Stay ahead with expertly rebalanced indexes that adapt to evolving market
                narratives.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Baskts */}
      <section className="py-16 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Featured Baskts</h2>
            <Button variant="outline" asChild>
              <Link href="/baskts">View All</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredBaskts.map((baskt) => (
              <BasktCard key={baskt.id} baskt={baskt} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
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
    </Layout>
  );
}
