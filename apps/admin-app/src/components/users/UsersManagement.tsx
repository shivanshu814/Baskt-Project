import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { useAccessCodes } from '../../hooks/access/useAccessCodes';
import { useCopyAddress } from '../../hooks/useCopyAddress';
import { FaucetDialog } from '../faucet/FaucetDialog';
import { UsersTable } from './UsersTable';
import { CombinedUser } from '../../types/users';

export function UsersManagement() {
  const { usersWithAccessCodes, isLoading } = useAccessCodes();
  const { handleCopyAddress } = useCopyAddress();
  const [faucetDialog, setFaucetDialog] = useState<{
    show: boolean;
    userAddress: string;
  }>({ show: false, userAddress: '' });

  // Only show users who have used access codes
  const accessCodeUsers = useMemo((): CombinedUser[] => {
    return usersWithAccessCodes.map((user) => ({
      account: user.address,
      role: 'Access Code User',
      source: 'access_code',
      accessCode: user.codeUsed,
    }));
  }, [usersWithAccessCodes]);

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
          <h2 className="mt-2 text-2xl font-bold text-white">
            Users Management ({accessCodeUsers.length})
          </h2>
          <p className="text-white/60 mt-1">Manage user roles and send faucet tokens to users</p>
        </div>
      </div>

      <UsersTable
        roles={accessCodeUsers}
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
