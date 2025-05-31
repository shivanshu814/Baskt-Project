'use client';

import { AddRoleDialog } from '../roles/AddRoleDialog';
import { RoleTable } from '../roles/RoleTable';
import { Button } from '../ui/button';
import { Plus } from 'lucide-react';
import { useRoles } from '../../hooks/roles/useRoles';
import { useCopyAddress } from '../../hooks/useCopyAddress';
import { useModal } from '../../hooks/useModal';

export function RolesManagement() {
  const { roles, isLoading, isOwner, fetchRoles, handleRemoveRole } = useRoles();
  const { copiedAddress, handleCopyAddress } = useCopyAddress();
  const { open, openModal, closeModal } = useModal();

  return (
    <div className="space-y-6">
      {isOwner && (
        <div className="flex justify-end mt-[-3rem]">
          <Button
            onClick={openModal}
            style={{
              marginTop: '-3.3rem',
              marginBottom: '3.3rem',
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Role
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
