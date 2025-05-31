'use client';

import { useState } from 'react';
import { useToast } from '../../hooks/use-toast';
import { useBasktClient } from '@baskt/ui';
import { PublicKey } from '@solana/web3.js';
import { AccessControlRole } from '@baskt/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ROLE_DISPLAY_MAP } from '@baskt/ui/types/constants';
import { AddRoleDialogProps } from '../../types/roles';

export function AddRoleDialog({
  showModal,
  setShowModal,
  onRoleAdded,
  isOwner,
}: AddRoleDialogProps) {
  const { toast } = useToast();
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
        toast({
          title: 'success',
          description: 'role added successfully',
        });
        setShowModal(false);
        onRoleAdded();
      } else {
        toast({
          title: 'transaction failed',
          description: 'please check your wallet balance and try again',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      const errorMessage = error?.message?.includes('insufficient funds')
        ? 'insufficient balance in your wallet'
        : error?.message || 'failed to add role';

      toast({
        title: 'error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Role</DialogTitle>
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
