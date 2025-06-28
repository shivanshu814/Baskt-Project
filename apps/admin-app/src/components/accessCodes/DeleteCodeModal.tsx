'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@baskt/ui';
import { Button } from '@baskt/ui';
import { Trash2, AlertTriangle } from 'lucide-react';
import { DeleteCodeModalProps } from '../../types/access';

export function DeleteCodeModal({
  isOpen,
  onClose,
  onConfirm,
  code,
  isLoading = false,
}: DeleteCodeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <DialogTitle className="text-red-500">Delete Access Code</DialogTitle>
          </div>
          <DialogDescription className="text-white/60">
            Are you sure you want to delete this access code? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center space-x-2">
              <code className="font-mono text-lg text-white">{code}</code>
            </div>
            <p className="text-white/60 text-sm mt-2">
              This code will be permanently removed from the system.
            </p>
          </div>
        </div>

        <DialogFooter className="flex space-x-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-500 hover:bg-red-600"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Deleting...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Trash2 className="w-4 h-4" />
                <span>Delete Code</span>
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
