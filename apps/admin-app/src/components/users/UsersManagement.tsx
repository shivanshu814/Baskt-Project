import { useState } from 'react';
import { toast } from 'sonner';
import { useRoles } from '../../hooks/roles/useRoles';
import { useCopyAddress } from '../../hooks/useCopyAddress';
import { FaucetDialog } from '../faucet/FaucetDialog';
import { UsersTable } from './UsersTable';

export function UsersManagement() {
  const { allUsers, isLoading } = useRoles();
  const { handleCopyAddress } = useCopyAddress();
  const [faucetDialog, setFaucetDialog] = useState<{
    show: boolean;
    userAddress: string;
  }>({ show: false, userAddress: '' });

  const handleFaucet = (userAddress: string) => {
    setFaucetDialog({ show: true, userAddress });
  };

  const handleFaucetComplete = () => {
    toast.success('Faucet sent successfully!');
    setFaucetDialog({ show: false, userAddress: '' });
  };

  const handleFaucetClose = () => {
    setFaucetDialog({ show: false, userAddress: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Users Management</h2>
          <p className="text-white/60 mt-1">Manage user roles and send faucet tokens to users</p>
        </div>
      </div>

      <UsersTable
        roles={allUsers}
        isLoading={isLoading}
        onCopyAddress={handleCopyAddress}
        onFaucet={handleFaucet}
      />

      <FaucetDialog
        showModal={faucetDialog.show}
        setShowModal={handleFaucetClose}
        userAddress={faucetDialog.userAddress}
        onFaucetComplete={handleFaucetComplete}
      />
    </div>
  );
}
