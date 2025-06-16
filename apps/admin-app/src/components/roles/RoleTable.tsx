import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Loading } from '../ui/loading';
import { Copy, Check } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { ROLE_DISPLAY_MAP } from '@baskt/ui';
import { RoleActions } from './RoleActions';
import { RoleTableProps } from '../../types/roles';

export function RoleTable({
  roles,
  isLoading,
  isOwner,
  copiedAddress,
  onCopyAddress,
  onRemoveRole,
}: RoleTableProps) {
  return (
    <div className="rounded-md border border-white/10">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User Address</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="w-[180px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={3} className="h-32">
                <div className="flex items-center justify-center">
                  <Loading />
                </div>
              </TableCell>
            </TableRow>
          ) : roles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="h-32">
                <div className="flex items-center justify-center text-white/60">No roles found</div>
              </TableCell>
            </TableRow>
          ) : (
            roles.map((role, index) => (
              <TableRow key={index}>
                <TableCell className="font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span>{role.account}</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            className="p-1 hover:bg-white/10 rounded-md"
                            onClick={() => onCopyAddress(role.account)}
                          >
                            {copiedAddress === role.account ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4 text-white/60" />
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{copiedAddress === role.account ? 'Copied!' : 'Copy address'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
                <TableCell>
                  {ROLE_DISPLAY_MAP[role.role as keyof typeof ROLE_DISPLAY_MAP] || role.role}
                </TableCell>
                <TableCell>
                  <RoleActions
                    account={role.account}
                    role={role.role}
                    isOwner={isOwner}
                    onCopyAddress={onCopyAddress}
                    onRemoveRole={onRemoveRole}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
