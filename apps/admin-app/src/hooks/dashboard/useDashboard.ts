/**
 * useAdminDashboard - Handles admin dashboard logic: tab state, owner check, modal state, loading and error.
 */
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { useBasktClient } from '@baskt/ui';
import { useModal } from '../useModal';

export function useAdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authenticated, ready } = usePrivy();
  const { client } = useBasktClient();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'assets');
  const {
    open: showRoleModal,
    openModal: openRoleModal,
    closeModal: closeRoleModal,
    setOpen: setShowRoleModal,
  } = useModal(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());

  useEffect(() => {
    const initializeDashboard = async () => {
      setLoading(true);
      setError(null);
      if (ready && !authenticated) {
        router.push('/');
        setLoading(false);
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

          // set permissions based on roles
          const userPermissions = new Set<string>();
          if (hasPermission) {
            userPermissions.add('manage_assets');
            userPermissions.add('manage_baskts');
            userPermissions.add('manage_liquidity');
          }
          setPermissions(userPermissions);
          // eslint-disable-next-line
        } catch (err: any) {
          setIsOwner(false);
          setError(err?.message || 'Failed to fetch protocol info');
        }
      }
      setLoading(false);
    };

    initializeDashboard();
  }, [ready, authenticated, router, client]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.replace(`?tab=${value}`);
  };

  const hasPermission = useCallback(
    (permissionKey: string) => {
      return permissions.has(permissionKey);
    },
    [permissions],
  );

  return {
    activeTab,
    setActiveTab,
    handleTabChange,
    showRoleModal,
    setShowRoleModal,
    openRoleModal,
    closeRoleModal,
    isOwner,
    hasPermission,
    loading,
    error,
  };
}
