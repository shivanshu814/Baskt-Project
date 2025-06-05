'use client';

import { Footer } from '../components/shared/Footer';
import { Hero } from '../components/home/Hero';
import { Features } from '../components/home/Features';
import { FeaturedBaskts } from '../components/home/FeaturedBaskts';
import { CallToAction } from '../components/home/CallToAction';

export default function Homepage() {
  return (
    <div>
      <Hero />
      <Features />
      <FeaturedBaskts />
      <CallToAction />
      <Footer />
    </div>
  );
}
