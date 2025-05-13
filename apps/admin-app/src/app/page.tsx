'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { useBasktClient } from '@baskt/ui';
import { Layout } from '../components/Layout';

import { AdminAssetsList } from '../components/admin/AdminAssetsList';
import { AdminBasktsList } from '../components/admin/AdminBasktsList';
import { ListNewAssetButton } from '../components/admin/ListNewAssetButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ProtocolDetails } from '../components/admin/ProtocolDetails';
import { RolesManagement } from '../components/admin/RolesManagement';
import { Button } from '../components/ui/button';
import { Plus } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const { authenticated, ready } = usePrivy();
  const { client } = useBasktClient();
  const [activeTab, setActiveTab] = useState('assets');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const initializeDashboard = async () => {
      if (ready && !authenticated) {
        router.push('/');
        return;
      }

      if (client) {
        try {
          const protocol = await client.getProtocolAccount();
          const userAddress = client.getPublicKey().toString();
          const isProtocolOwner = protocol.owner === userAddress;
          const hasOwnerRole = protocol.accessControl.entries.some(
            (entry) => entry.account === userAddress && entry.role.toLowerCase() === 'owner',
          );
          const hasPermission = isProtocolOwner || hasOwnerRole;
          setIsOwner(hasPermission);
        } catch (error) {
          setIsOwner(false);
        }
      }
    };

    initializeDashboard();
  }, [ready, authenticated, router, client]);

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-white">Admin Dashboard</h1>
          {activeTab === 'assets' && <ListNewAssetButton />}
          {activeTab === 'roles' && isOwner && (
            <Button onClick={() => setShowRoleModal(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add New Role
            </Button>
          )}
        </div>

        <Tabs defaultValue="assets" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="bg-[#1a1f2e] p-1 rounded-lg border border-white/10">
            <TabsTrigger
              value="assets"
              className="rounded-md px-4 py-2 text-sm font-medium text-white/60 data-[state=active]:bg-[#0d1117] data-[state=active]:text-white hover:text-white transition-colors"
            >
              Assets
            </TabsTrigger>

            <TabsTrigger
              value="baskts"
              className="rounded-md px-4 py-2 text-sm font-medium text-white/60 data-[state=active]:bg-[#0d1117] data-[state=active]:text-white hover:text-white transition-colors"
            >
              Baskts
            </TabsTrigger>

            <TabsTrigger
              value="protocol"
              className="rounded-md px-4 py-2 text-sm font-medium text-white/60 data-[state=active]:bg-[#0d1117] data-[state=active]:text-white hover:text-white transition-colors"
            >
              Protocol
            </TabsTrigger>

            <TabsTrigger
              value="roles"
              className="rounded-md px-4 py-2 text-sm font-medium text-white/60 data-[state=active]:bg-[#0d1117] data-[state=active]:text-white hover:text-white transition-colors"
            >
              Roles
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assets" className="space-y-4">
  <div className="glass-modal rounded-3xl">
    <AdminAssetsList />
  </div>
</TabsContent>

<TabsContent value="baskts" className="space-y-4">
  <div className="glass-modal rounded-3xl">
    <AdminBasktsList />
  </div>
</TabsContent>

          <TabsContent value="protocol" className="space-y-4">
            <div className="glass-modal rounded-3xl">
              <ProtocolDetails />
            </div>
          </TabsContent>

          <TabsContent value="roles" className="space-y-4">
            <div className="glass-modal rounded-3xl">
              <RolesManagement showModal={showRoleModal} setShowModal={setShowRoleModal} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
