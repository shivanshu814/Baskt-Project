/** @format */

'use client';

import { Toaster } from '../components/src/toaster';
import { Toaster as Sonner } from '../components/src/sonner';
import { TooltipProvider } from '../components/src/tooltip';
import Homepage from './homepage/page';

export default function Home() {
  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Homepage />
    </TooltipProvider>
  );
}
