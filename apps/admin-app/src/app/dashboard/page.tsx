'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { Layout } from '../../components/Layout';
import { Switch } from '../../components/ui/switch';
import { OraclesList } from '../../components/admin/OraclesList';
import { AdminAssetsList } from '../../components/admin/AdminAssetsList';
import { ListNewAssetButton } from '../../components/admin/ListNewAssetButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

export default function AdminDashboard() {
  const router = useRouter();
  const { authenticated, ready } = usePrivy();
  const [isSystemActive, setIsSystemActive] = useState(true);

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
              value="system"
              className="rounded-md px-4 py-2 text-sm font-medium text-white/60 data-[state=active]:bg-[#0d1117] data-[state=active]:text-white hover:text-white transition-colors"
            >
              System
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assets" className="space-y-4">
            <div className="glass-modal rounded-3xl">
              <AdminAssetsList />
            </div>
          </TabsContent>

          <TabsContent value="oracles" className="space-y-4">
            <div className="glass-modal rounded-3xl">
              <OraclesList />
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <div className="glass-modal rounded-3xl">
              <div className="p-8">
                <div className="flex flex-col space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1.5">
                      <h3 className="text-lg font-medium text-white">System Status</h3>
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${isSystemActive ? 'bg-green-400' : 'bg-red-400'}`}
                        ></div>
                        <span className="text-[#E5E7EB]">
                          {isSystemActive ? 'System Operational' : 'System Paused'}
                        </span>
                      </div>
                    </div>
                    <Switch
                      checked={isSystemActive}
                      onCheckedChange={setIsSystemActive}
                      className="data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-white"
                    />
                  </div>
                  <div className="space-y-2 border-t border-white/10 pt-6">
                    <h4 className="text-sm font-medium text-white/60">System Health</h4>
                    <p className="text-sm text-white/80 leading-relaxed">
                      All systems are operating normally. Oracle feeds are updating regularly, and
                      all assets are being tracked correctly. The system is processing trades and
                      maintaining accurate price data across all supported assets.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
