'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Plus } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { usePrivy } from '@privy-io/react-auth';
import { useBasktClient } from '@baskt/ui';
import { ListNewAssetDialog } from './ListNewAssetDialog';

export function ListNewAssetButton() {
  const [showModal, setShowModal] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const { client } = useBasktClient();
  const { authenticated } = usePrivy();
  const { toast } = useToast();

  useEffect(() => {
    const checkPermission = async () => {
      if (!client || !authenticated) {
        setHasPermission(false);
        return;
      }
      try {
        const protocol = await client.getProtocolAccount();
        const userAddress = client.getPublicKey().toString();
        const hasPermission =
          protocol.owner === userAddress ||
          protocol.accessControl.entries.some(
            (entry) =>
              entry.account === userAddress &&
              (entry.role === 'AssetManager' || entry.role.toLowerCase() === 'owner'),
          );
        setHasPermission(hasPermission);
      } catch (error) {
        setHasPermission(false);
        toast({
          title: 'Permission Error',
          description: 'Could not check asset listing permissions',
          variant: 'destructive',
        });
      }
    };
    checkPermission();
  }, [client, authenticated, toast]);

  if (!hasPermission) return null;

  return (
    <>
      <Button onClick={() => setShowModal(true)}>
        <Plus className="mr-2 h-4 w-4" /> List New Asset
      </Button>
      <ListNewAssetDialog open={showModal} onOpenChange={setShowModal} />
    </>
  );
}
