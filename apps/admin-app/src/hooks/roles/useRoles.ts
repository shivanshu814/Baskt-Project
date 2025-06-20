import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useBasktClient } from '@baskt/ui';
import { PublicKey } from '@solana/web3.js';
import { AccessControlRole } from '@baskt/types';
import { Role } from '../../types/roles';

export function useRoles() {
  const { client } = useBasktClient();
  const [isLoading, setIsLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isOwner, setIsOwner] = useState(false);

  const checkOwnerPermission = async () => {
    if (!client) return;
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
  };

  const fetchRoles = async () => {
    if (!client) return;
    setIsLoading(true);
    try {
      const protocolAccount = await client.getProtocolAccount();
      if (protocolAccount?.accessControl?.entries) {
        const formattedRoles: Role[] = protocolAccount.accessControl.entries.map((entry) => ({
          account: entry.account,
          role: entry.role,
        }));
        setRoles(formattedRoles);
      }
    } catch (error) {
      toast.error('Failed to fetch the roles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveRole = async (account: string, role: string) => {
    if (!client || !isOwner) {
      toast.error('Only owners can remove roles');
      return;
    }

    setIsLoading(true);
    try {
      const protocol = await client.getProtocolAccount();
      const userAddress = client.getPublicKey().toString();

      if (account === userAddress) {
        toast.error('Cannot remove your own role');
        return;
      }

      if (protocol.owner === account) {
        toast.error('Cannot remove the protocol owner');
        return;
      }

      const txSignature = await client.removeRole(
        new PublicKey(account),
        AccessControlRole[role as keyof typeof AccessControlRole],
      );
      if (txSignature) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        toast.success('Role removed successfully');
        await fetchRoles();
      } else {
        toast.error('Transaction Failed. Please check your wallet balance and try again');
      }
      // eslint-disable-next-line
    } catch (error: any) {
      const errorMessage = error?.message?.includes('insufficient funds')
        ? 'Insufficient balance in your wallet'
        : error?.message || 'Failed to remove role';

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (client) {
      checkOwnerPermission();
      fetchRoles();
    }
  }, [client]);

  return {
    roles,
    isLoading,
    isOwner,
    fetchRoles,
    handleRemoveRole,
  };
}
