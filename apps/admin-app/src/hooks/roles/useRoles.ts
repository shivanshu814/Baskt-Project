import { useState, useEffect } from 'react';
import { useToast } from '../use-toast';
import { useBasktClient } from '@baskt/ui';
import { PublicKey } from '@solana/web3.js';
import { AccessControlRole } from '@baskt/types';
import { Role } from '../../types/roles';

export function useRoles() {
  const { toast } = useToast();
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
      toast({
        title: 'Error',
        description: 'Failed to fetch the roles',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveRole = async (account: string, role: string) => {
    if (!client || !isOwner) {
      toast({
        title: 'Error',
        description: 'Only owners can remove roles',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const protocol = await client.getProtocolAccount();
      const userAddress = client.getPublicKey().toString();

      if (account === userAddress) {
        toast({
          title: 'Error',
          description: 'Cannot remove your own role',
          variant: 'destructive',
        });
        return;
      }

      if (protocol.owner === account) {
        toast({
          title: 'Error',
          description: 'Cannot remove the protocol owner',
          variant: 'destructive',
        });
        return;
      }

      const txSignature = await client.removeRole(
        new PublicKey(account),
        AccessControlRole[role as keyof typeof AccessControlRole],
      );
      if (txSignature) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        toast({
          title: 'Success',
          description: 'Role removed successfully',
        });
        await fetchRoles();
      } else {
        toast({
          title: 'Transaction Failed',
          description: 'Please check your wallet balance and try again',
          variant: 'destructive',
        });
      }
      // eslint-disable-next-line
    } catch (error: any) {
      const errorMessage = error?.message?.includes('insufficient funds')
        ? 'Insufficient balance in your wallet'
        : error?.message || 'Failed to remove role';

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
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
