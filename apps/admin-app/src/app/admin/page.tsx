import { Layout } from '../../components/Layout';
import { AdminAssetsList } from '../../components/admin/AdminAssetsList';
import { ListNewAssetButton } from '../../components/admin/ListNewAssetButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/src/tabs';
import { OraclesList } from '../../components/admin/OraclesList';

export default function AdminDashboard() {
  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <ListNewAssetButton />
        </div>

        <Tabs defaultValue="assets" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="oracles">Oracles</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="assets" className="space-y-4">
            <AdminAssetsList />
          </TabsContent>

          <TabsContent value="oracles" className="space-y-4">
            <OraclesList />
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <div className="p-6 border rounded-lg bg-card">
              <h3 className="text-xl font-medium mb-4">System Status</h3>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>System Operational</span>
              </div>
              <div className="mt-4">
                <button className="bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 py-2 rounded">
                  Pause System
                </button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
