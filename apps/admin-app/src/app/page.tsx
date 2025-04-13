'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { Layout } from '../components/Layout';
import { OraclesList } from '../components/admin/OraclesList';
import { AdminAssetsList } from '../components/admin/AdminAssetsList';
import { ListNewAssetButton } from '../components/admin/ListNewAssetButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ProtocolDetails } from '../components/admin/ProtocolDetails';

export default function AdminDashboard() {
  const router = useRouter();
  const { authenticated, ready } = usePrivy();

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/login');
    }
  }, [ready, authenticated, router]);

  if (!ready || !authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#010b1d] to-[#011330]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-24 w-24 rounded-full border-2 border-white/10 border-t-blue-500 animate-spin" />
            <div className="absolute inset-0 h-24 w-24 rounded-full border-2 border-white/5 border-r-blue-500 animate-spin-slow" />
          </div>
          <p className="text-lg text-white/60 animate-pulse mt-6">Please wait...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-white">Admin Dashboard</h1>
          <ListNewAssetButton />
        </div>

        <Tabs defaultValue="assets" className="w-full">
          <TabsList className="bg-[#1a1f2e] p-1 rounded-lg border border-white/10">
            <TabsTrigger
              value="assets"
              className="rounded-md px-4 py-2 text-sm font-medium text-white/60 data-[state=active]:bg-[#0d1117] data-[state=active]:text-white hover:text-white transition-colors"
            >
              Assets
            </TabsTrigger>
            <TabsTrigger
              value="oracles"
              className="rounded-md px-4 py-2 text-sm font-medium text-white/60 data-[state=active]:bg-[#0d1117] data-[state=active]:text-white hover:text-white transition-colors"
            >
              Oracles
            </TabsTrigger>

            <TabsTrigger
              value="protocol"
              className="rounded-md px-4 py-2 text-sm font-medium text-white/60 data-[state=active]:bg-[#0d1117] data-[state=active]:text-white hover:text-white transition-colors"
            >
              Protocol
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assets" className="space-y-4">
            <div className="glass-modal rounded-3xl">
              <AdminAssetsList />
            </div>
          </TabsContent>

          <TabsContent value="protocol" className="space-y-4">
            <div className="glass-modal rounded-3xl">
              <ProtocolDetails />
            </div>
          </TabsContent>

          <TabsContent value="oracles" className="space-y-4">
            <div className="glass-modal rounded-3xl">
              <OraclesList />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
