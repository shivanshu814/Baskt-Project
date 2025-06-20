'use client';

import { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@baskt/ui';
import { TAB_CONFIG } from '../../config/tabs';
import { TAB_IDS } from '../../constants/tabs';
import { AdminTabsProps } from '../../types';

/**
 * Renders the admin dashboard tabs and their content.
 */
export function AdminTabs({
  activeTab,
  handleTabChange,
  showRoleModal,
  setShowRoleModal,
  isOwner,
  hasPermission,
  renderActionButton,
}: AdminTabsProps) {
  const visibleTabs = useMemo(() => {
    // if user is owner show all tabs
    if (isOwner) {
      return TAB_CONFIG;
    }

    // for non owners only show assets and baskts
    return TAB_CONFIG.filter((tab) => tab.id === TAB_IDS.ASSETS || tab.id === TAB_IDS.BASKTS);
  }, [isOwner]);

  const tabTriggers = useMemo(() => {
    return visibleTabs.map((tab) => (
      <TabsTrigger
        key={tab.id}
        value={tab.id}
        className="rounded-md px-4 py-2 text-sm font-medium text-white/60 data-[state=active]:bg-[#0d1117] data-[state=active]:text-white hover:text-white transition-colors"
      >
        {tab.label}
      </TabsTrigger>
    ));
  }, [visibleTabs]);

  const tabContent = useMemo(() => {
    return visibleTabs.map((tab) => (
      <TabsContent key={tab.id} value={tab.id} className="space-y-4">
        <div className="glass-modal rounded-3xl">
          <tab.component
            isOwner={isOwner}
            hasPermission={hasPermission(tab.permissionKey || '')}
            showModal={tab.id === TAB_IDS.ROLES ? showRoleModal : undefined}
            setShowModal={tab.id === TAB_IDS.ROLES ? setShowRoleModal : undefined}
          />
        </div>
      </TabsContent>
    ));
  }, [visibleTabs, isOwner, hasPermission, showRoleModal, setShowRoleModal]);

  const headerSection = useMemo(() => {
    return (
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-white">Admin Dashboard</h1>
        {renderActionButton(activeTab)}
      </div>
    );
  }, [activeTab, renderActionButton]);

  return (
    <>
      {headerSection}
      <Tabs value={activeTab} className="w-full" onValueChange={handleTabChange}>
        <TabsList className="bg-[#1a1f2e] p-1 rounded-lg border border-white/10">
          {tabTriggers}
        </TabsList>
        {tabContent}
      </Tabs>
    </>
  );
}
