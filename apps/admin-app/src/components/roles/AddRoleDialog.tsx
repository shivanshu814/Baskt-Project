'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  useBasktClient,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
  ROLE_DISPLAY_MAP,
} from '@baskt/ui';
import { PublicKey } from '@solana/web3.js';
import { AccessControlRole } from '@baskt/types';
import { AddRoleDialogProps } from '../../types/roles';

export function AddRoleDialog({
  showModal,
  setShowModal,
  onRoleAdded,
  isOwner,
}: AddRoleDialogProps) {
  const { client } = useBasktClient();
  const [address, setAddress] = useState('');
  const [role, setRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !isOwner) return;

    try {
      setIsLoading(true);
      const txSignature = await client.addRole(
        new PublicKey(address),
        AccessControlRole[role as keyof typeof AccessControlRole],
      );

      if (txSignature) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        toast.success('Role added successfully');
        setShowModal(false);
        onRoleAdded();
      } else {
        toast.error('Transaction failed. Please check your wallet balance and try again');
      }
      // eslint-disable-next-line
    } catch (error: any) {
      const errorMessage = error?.message?.includes('insufficient funds')
        ? 'Insufficient balance in your wallet'
        : error?.message || 'Failed to add role';

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Role</DialogTitle>
          <DialogDescription>
            Assign a new role to a user by entering their wallet address and selecting the role
            type.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">User Address</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter Solana address"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ROLE_DISPLAY_MAP).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Role'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
