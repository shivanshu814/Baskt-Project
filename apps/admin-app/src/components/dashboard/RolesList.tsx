'use client';

import { Button } from '@baskt/ui';
import { Plus } from 'lucide-react';
import { useRoles } from '../../hooks/roles/useRoles';
import { useCopyAddress } from '../../hooks/useCopyAddress';
import { useModal } from '../../hooks/useModal';
import { AddRoleDialog } from '../roles/AddRoleDialog';
import { RoleTable } from '../roles/RoleTable';

export function RolesManagement() {
  const { roles, isLoading, isOwner, fetchRoles, handleRemoveRole } = useRoles();
  const { copiedAddress, handleCopyAddress } = useCopyAddress();
  const { open, openModal, closeModal } = useModal();
  console.log('roles', roles);
  return (
    <div className="space-y-6">
      {isOwner && (
        <div className="flex justify-end mt-[-5rem] md:mt-[-3rem]">
          <Button
            onClick={openModal}
            style={{
              marginTop: '-3rem',
              marginBottom: '3.3rem',
            }}
            className="md:mt-[-3rem] md:mb-[3.3rem]"
          >
            <Plus className="mr-2 h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Add New Role</span>
          </Button>
        </div>
      )}

      <AddRoleDialog
        showModal={open}
        setShowModal={closeModal}
        onRoleAdded={fetchRoles}
        isOwner={isOwner}
      />

      <RoleTable
        roles={roles}
        isLoading={isLoading}
        isOwner={isOwner}
        copiedAddress={copiedAddress}
        onCopyAddress={handleCopyAddress}
        onRemoveRole={handleRemoveRole}
      />
    </div>
  );
}
