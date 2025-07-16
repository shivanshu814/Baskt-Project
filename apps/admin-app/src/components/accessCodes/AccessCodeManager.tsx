'use client';

import { Button, PublicKeyText } from '@baskt/ui';
import { Plus, Copy, Trash2, Check, User } from 'lucide-react';
import { DeleteCodeModal } from './DeleteCodeModal';
import { formatDate } from '../../utils/date';
import { useAccessCodes } from '../../hooks/access/useAccessCodes';

export function AccessCodeManager() {
  const {
    accessCodes,
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
  } = useAccessCodes();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <span className="text-white/80">Loading access codes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mt-2 text-2xl font-bold text-white">Access Code Management</h2>
          <p className="text-white/60 mt-1">Generate and manage access codes for platform users</p>
        </div>
        <Button onClick={handleGenerateCode} disabled={generateCodeMutation.isLoading}>
          <Plus className="h-4 w-4 mr-2" />
          Generate New Code
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="text-2xl font-bold text-white">{accessCodes?.length || 0}</div>
          <div className="text-white/60 text-sm">Total Codes</div>
        </div>
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="text-2xl font-bold text-green-400">
            {accessCodes?.filter((code: any) => !code.isUsed).length || 0}
          </div>
          <div className="text-white/60 text-sm">Available Codes</div>
        </div>
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="text-2xl font-bold text-blue-400">
            {accessCodes?.filter((code: any) => code.isUsed).length || 0}
          </div>
          <div className="text-white/60 text-sm">Used Codes</div>
        </div>
      </div>

      {newCode && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-green-400 font-semibold">New Access Code Generated!</h3>
              <p className="text-white/80 text-sm mt-1">
                Share this code with the user. It will expire in 30 days.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <code className="bg-black/20 px-3 py-2 rounded text-green-400 font-mono text-lg">
                {newCode}
              </code>
              <Button variant="outline" size="sm" onClick={() => handleCopyCode(newCode)}>
                {copiedCode === newCode ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white/5 rounded-lg border border-white/10">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">All Access Codes</h3>

          {!accessCodes || accessCodes?.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/60">No access codes generated yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {accessCodes.map((code: any) => (
                <div
                  key={code.code}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    code.isUsed ? 'bg-blue-500/10 border-blue-500/20' : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div>
                      <code className="font-mono text-lg text-white">{code.code}</code>
                      <div className="flex items-center space-x-4 mt-1 text-sm">
                        <span
                          className={`px-2 py-1 rounded ${
                            code.isUsed
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-green-500/20 text-green-400'
                          }`}
                        >
                          {code.isUsed ? 'Used' : 'Available'}
                        </span>
                        <span className="text-white/60">
                          Created:{' '}
                          {formatDate(Math.floor(new Date(code.createdAt).getTime() / 1000))}
                        </span>
                        <span className="text-white/60">
                          Expires:{' '}
                          {formatDate(Math.floor(new Date(code.expiresAt).getTime() / 1000))}
                        </span>
                      </div>
                      {code.usedBy && (
                        <div className="flex items-center space-x-2 mt-1 text-sm">
                          <User className="h-3 w-3 text-blue-400" />
                          <span className="text-blue-400 font-mono">
                            <PublicKeyText publicKey={code.usedBy} isCopy={true} />
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {!code.isUsed && (
                      <Button variant="outline" size="sm" onClick={() => handleCopyCode(code.code)}>
                        {copiedCode === code.code ? (
                          <Check className="h-4 w-4 text-green-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCode(code.code)}
                      disabled={deleteCodeMutation.isLoading}
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <DeleteCodeModal
        isOpen={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        code={codeToDelete || ''}
        isLoading={deleteCodeMutation.isLoading}
      />
    </div>
  );
}
