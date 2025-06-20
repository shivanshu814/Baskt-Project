import { MoreVertical, Copy, SquareArrowOutUpRight, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  Button,
} from '@baskt/ui';
import { RoleActionsProps } from '../../types/roles';

export function RoleActions({
  account,
  role,
  isOwner,
  onCopyAddress,
  onRemoveRole,
}: RoleActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onCopyAddress(account)}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Address
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => window.open(`https://solscan.io/account/${account}`, '_blank')}
          >
            <SquareArrowOutUpRight className="mr-2 h-4 w-4" />
            View on Explorer
          </DropdownMenuItem>
          {isOwner && (
            <DropdownMenuItem
              onClick={() => onRemoveRole(account, role)}
              className="text-red-500 focus:text-red-500"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove Role
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
