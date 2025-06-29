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
  const [allUsers, setAllUsers] = useState<Role[]>([]);
  const [isOwner] = useState(true);

  // const checkOwnerPermission = async () => {
  //   if (!client) return;
  //   try {
  //     const protocol = await client.getProtocolAccount();
  //     const userAddress = client.getPublicKey().toString();

  //     const isProtocolOwner = protocol.owner === userAddress;
  //     const hasOwnerRole = protocol.accessControl.entries.some(
  //       (entry) => entry.account === userAddress && entry.role.toLowerCase() === 'owner',
  //     );
  //     const hasPermission = isProtocolOwner || hasOwnerRole;
  //     setIsOwner(hasPermission);
  //   } catch (error) {
  //     setIsOwner(false);
  //   }
  // };

  const fetchAllUsers = async () => {
    if (!client) return;
    setIsLoading(true);
    try {
      const userAddresses = new Set<string>();
      const protocolAccount = await client.getProtocolAccount();
      userAddresses.add(protocolAccount.owner);

      if (protocolAccount?.accessControl?.entries) {
        protocolAccount.accessControl.entries.forEach((entry) => {
          userAddresses.add(entry.account);
        });
      }

      try {
        const positions = await client.getAllPositions();
        positions.forEach((position) => {
          userAddresses.add(position.owner.toString());
        });
      } catch (error) {
        toast('Failed to fetch positions');
      }

      try {
        const orders = await client.getAllOrders();
        orders.forEach((order) => {
          userAddresses.add(order.owner.toString());
        });
      } catch (error) {
        toast('Failed to fetch orders');
      }

      const usersWithRoles = new Map<string, string>();
      if (protocolAccount?.accessControl?.entries) {
        protocolAccount.accessControl.entries.forEach((entry) => {
          usersWithRoles.set(entry.account, entry.role);
        });
      }

      const allUsersList: Role[] = Array.from(userAddresses).map((address) => ({
        account: address,
        role: usersWithRoles.get(address) || 'No Role',
      }));

      setAllUsers(allUsersList);

      const formattedRoles: Role[] = Array.from(usersWithRoles.entries()).map(
        ([account, role]) => ({
          account,
          role,
        }),
      );
      setRoles(formattedRoles);
    } catch (error) {
      toast('Failed to fetch users');
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
        await fetchAllUsers();
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
      // checkOwnerPermission();
      fetchAllUsers();
    }
  }, [client]);

  return {
    roles,
    allUsers,
    isLoading,
    isOwner,
    fetchRoles: fetchAllUsers,
    handleRemoveRole,
  };
}
