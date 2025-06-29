'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { usePrivy } from '@privy-io/react-auth';
import { useBasktClient, Button } from '@baskt/ui';
import { ListNewAssetDialog } from './ListNewAssetDialog';

export function ListNewAssetButton() {
  const [showModal, setShowModal] = useState(false);
  const [hasPermission, setHasPermission] = useState(true);
  const { client } = useBasktClient();
  const { authenticated } = usePrivy();

  // useEffect(() => {
  //   const checkPermission = async () => {
  //     if (!client || !authenticated) {
  //       setHasPermission(false);
  //       return;
  //     }
  //     try {
  //       const protocol = await client.getProtocolAccount();
  //       const userAddress = client.getPublicKey().toString();
  //       const hasPermission =
  //         protocol.owner === userAddress ||
  //         protocol.accessControl.entries.some(
  //           (entry) =>
  //             entry.account === userAddress &&
  //             (entry.role === 'AssetManager' || entry.role.toLowerCase() === 'owner'),
  //         );
  //       setHasPermission(hasPermission);
  //     } catch (error) {
  //       setHasPermission(false);
  //       toast.error('Could not check asset listing permissions');
  //     }
  //   };
  //   checkPermission();
  // }, [client, authenticated]);

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
