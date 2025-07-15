'use client';

import { useState, useCallback } from 'react';
import { trpc } from '../../utils/trpc';
import { toast } from 'sonner';

export function useAccessCodes() {
  const [newCode, setNewCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [codeToDelete, setCodeToDelete] = useState<string | null>(null);

  const { data: accessCodes, isLoading, refetch } = trpc.accessCode.getAll.useQuery();

  const generateCodeMutation = trpc.accessCode.generate.useMutation({
    onSuccess: (data) => {
      setNewCode(data.code);
      refetch();
    },
  });

  const deleteCodeMutation = trpc.accessCode.delete.useMutation({
    onSuccess: () => {
      refetch();
      setDeleteModalOpen(false);
      setCodeToDelete(null);
    },
  });

  const handleGenerateCode = useCallback(() => {
    generateCodeMutation.mutate({});
  }, [generateCodeMutation]);

  const handleDeleteCode = useCallback((code: string) => {
    setCodeToDelete(code);
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (codeToDelete) {
      deleteCodeMutation.mutate({ code: codeToDelete });
    }
  }, [codeToDelete, deleteCodeMutation]);

  const handleCloseDeleteModal = useCallback(() => {
    setDeleteModalOpen(false);
    setCodeToDelete(null);
  }, []);

  const handleCopyCode = useCallback(async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      toast('Failed to copy code');
    }
  }, []);

  const clearNewCode = useCallback(() => {
    setNewCode(null);
  }, []);

  return {
    accessCodes: accessCodes?.data || [],
    isLoading,
    newCode,
    copiedCode,
    deleteModalOpen,
    codeToDelete,
    generateCodeMutation,
    deleteCodeMutation,
    handleGenerateCode,
    handleDeleteCode,
    handleConfirmDelete,
    handleCloseDeleteModal,
    handleCopyCode,
    clearNewCode,
  };
}
