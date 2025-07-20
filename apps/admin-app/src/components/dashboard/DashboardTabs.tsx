'use client';

import { useMemo, useState } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Button,
} from '@baskt/ui';
import { TAB_CONFIG } from '../../config/tabs';
import { TAB_IDS } from '../../constants/tabs';
import { AdminTabsProps } from '../../types';
import { Menu } from 'lucide-react';

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
  const visibleTabs = TAB_CONFIG;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const mobileMenuItems = useMemo(() => {
    return visibleTabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => {
          handleTabChange(tab.id);
          setMobileMenuOpen(false);
        }}
        className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
          activeTab === tab.id
            ? 'bg-[#0d1117] text-white'
            : 'text-white/60 hover:text-white hover:bg-[#1a1f2e]'
        }`}
      >
        {tab.label}
      </button>
    ));
  }, [visibleTabs, activeTab, handleTabChange]);

  return (
    <>
      {headerSection}

      <div className="md:hidden mb-6">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="w-full bg-[#1a1f2e] border-white/10 text-white hover:bg-[#1a1f2e]/90"
            >
              <Menu className="h-4 w-4 mr-2" />
              {visibleTabs.find((tab) => tab.id === activeTab)?.label || 'Select Tab'}
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[280px] bg-gradient-to-b from-[#010b1d] to-[#011330] border-white/10"
          >
            <SheetHeader className="border-b border-white/10 pb-4">
              <SheetTitle className="text-white">Admin Dashboard</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-2 mt-6">{mobileMenuItems}</div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="hidden md:block">
        <Tabs value={activeTab} className="w-full" onValueChange={handleTabChange}>
          <TabsList className="bg-[#1a1f2e] p-1 rounded-lg border border-white/10">
            {tabTriggers}
          </TabsList>
          {tabContent}
        </Tabs>
      </div>

      <div className="md:hidden">
        <div className="space-y-4">
          <div className="glass-modal rounded-3xl">
            {(() => {
              const activeTabConfig = visibleTabs.find((tab) => tab.id === activeTab);
              if (activeTabConfig) {
                const TabComponent = activeTabConfig.component;
                return (
                  <TabComponent
                    isOwner={isOwner}
                    hasPermission={hasPermission(activeTabConfig.permissionKey || '')}
                    showModal={activeTab === TAB_IDS.ROLES ? showRoleModal : undefined}
                    setShowModal={activeTab === TAB_IDS.ROLES ? setShowRoleModal : undefined}
                  />
                );
              }
              return null;
            })()}
          </div>
        </div>
      </div>
    </>
  );
}
