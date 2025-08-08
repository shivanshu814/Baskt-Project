'use client';

import { CallToAction } from '../components/home/CallToAction';
import { Features } from '../components/home/Features';
import { Hero } from '../components/home/Hero';
import { HowItWorks } from '../components/home/HowItWorks';
import { Stats } from '../components/home/Stats';
import { Footer } from '../components/shared/Footer';

export default function Homepage() {
  return (
    <div className="mt-16">
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <CallToAction />
      <Footer />
    </div>
  );
}
