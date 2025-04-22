'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { Layout } from '../components/Layout';

import { AdminAssetsList } from '../components/admin/AdminAssetsList';
import { ListNewAssetButton } from '../components/admin/ListNewAssetButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ProtocolDetails } from '../components/admin/ProtocolDetails';

export default function AdminDashboard() {
  const router = useRouter();
  const { authenticated, ready } = usePrivy();

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    }
  }, [ready, authenticated, router]);

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


        </Tabs>
      </div>
    </Layout>
  );
}
