'use client';

/**
 * AdminDashboard page - renders the admin dashboard UI, uses useAdminDashboard for logic.
 */
import { useMemo, useCallback } from 'react';
import { useAdminDashboard } from '../hooks/dashboard/useDashboard';
import { Layout } from '../components/Layout';
import { Button } from '@baskt/ui';
import { Plus } from 'lucide-react';
import { TAB_CONFIG } from '../config/tabs';
import { TAB_IDS, TabId } from '../constants/tabs';
import { AdminTabs } from '../components/dashboard/DashboardTabs';

export default function AdminDashboard() {
  const {
    activeTab,
    handleTabChange,
    showRoleModal,
    setShowRoleModal,
    openRoleModal,
    isOwner,
    hasPermission,
    loading,
    error,
  } = useAdminDashboard();

  const renderActionButton = useCallback(
    (tabId: TabId) => {
      const tab = TAB_CONFIG.find((t) => t.id === tabId);
      if (!tab?.actionButton) return null;
      if (tab.requiresOwner && !isOwner) return null;
      if (tab.requiresPermission && tab.permissionKey && !hasPermission(tab.permissionKey))
        return null;

      if (tabId === TAB_IDS.ROLES) {
        return (
          <Button onClick={openRoleModal}>
            <Plus className="h-4 w-4 mr-2" /> Add New Role
          </Button>
        );
      }
      return <tab.actionButton />;
    },
    [isOwner, hasPermission, openRoleModal],
  );

  const loadingState = useMemo(() => {
    if (loading) {
      return (
        <Layout>
          <div className="flex items-center justify-center min-h-[60vh]">
            <span className="text-white/80 text-lg">Loading...</span>
          </div>
        </Layout>
      );
    }
    return null;
  }, [loading]);

  const errorState = useMemo(() => {
    if (error) {
      return (
        <Layout>
          <div className="flex items-center justify-center min-h-[60vh]">
            <span className="text-red-400 text-lg">{error}</span>
          </div>
        </Layout>
      );
    }
    return null;
  }, [error]);

  if (loadingState) return loadingState;
  if (errorState) return errorState;

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <AdminTabs
          activeTab={activeTab as TabId}
          handleTabChange={handleTabChange}
          showRoleModal={showRoleModal}
          setShowRoleModal={setShowRoleModal}
          isOwner={isOwner}
          hasPermission={hasPermission}
          renderActionButton={renderActionButton}
        />
      </div>
    </Layout>
  );
}
