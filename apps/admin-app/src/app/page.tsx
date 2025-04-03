/** @format */

'use client';

import { Toaster } from '../components/ui/toaster';
import { Toaster as Sonner } from '../components/ui/sonner';
import { TooltipProvider } from '../components/ui/tooltip';
import AdminDashboard from './admin/page';

export default function Home() {
  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AdminDashboard />
    </TooltipProvider>
  );
}
