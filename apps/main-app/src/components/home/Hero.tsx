import { Button } from '@baskt/ui';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '../../routes/route';

export function Hero() {
  return (
    <section className="bg-gradient-to-b from-primary/10 to-background pt-16 pb-20">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          Create & Trade Your Own <span className="text-primary">Baskts</span>
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto mb-8">
          Build custom baskets with multiple assets and trade them on our platform. AI-powered
          rebalancing minimizes losses while maximizing returns. Deposit funds, get BLP tokens, and
          start trading with intelligent portfolio management.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/create-baskt">
              Launch Baskt
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href={ROUTES.EXPLORE}>Explore Baskts</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
