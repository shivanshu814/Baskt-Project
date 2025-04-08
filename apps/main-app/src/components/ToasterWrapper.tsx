'use client';

import { Toaster } from '../components/src/toaster';
import { Toaster as Sonner } from '../components/src/sonner';

export function ToasterWrapper() {
  return (
    <>
      <Toaster />
      <Sonner />
    </>
  );
}
