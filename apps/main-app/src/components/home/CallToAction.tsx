import { Button } from '@baskt/ui';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function CallToAction() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4 text-center max-w-3xl">
        <h2 className="text-3xl font-bold mb-4">Ready to Start Trading?</h2>
        <p className="text-xl text-muted-foreground mb-8">
          Join thousands of investors who are already using Baskt to simplify their crypto journey.
        </p>
        <Button size="lg" asChild>
          <Link href="/baskts">
            Get Started Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
