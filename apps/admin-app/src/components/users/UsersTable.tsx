import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Loading,
  ROLE_DISPLAY_MAP,
  PublicKeyText,
  Button,
} from '@baskt/ui';
import { Copy, SquareArrowOutUpRight, Coins, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@baskt/ui';
import { UsersTableProps } from '../../types/faucet';

export function UsersTable({ roles, isLoading, onCopyAddress, onFaucet }: UsersTableProps) {
  return (
    <div className="rounded-md border border-white/10">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User Address</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="w-[200px]">Actions</TableHead>
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
                <div className="flex items-center justify-center text-white/60">No users found</div>
              </TableCell>
            </TableRow>
          ) : (
            roles.map((role, index) => (
              <TableRow key={index}>
                <TableCell className="font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span>
                      <PublicKeyText publicKey={role.account} isCopy={true} noFormat={true} />
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {ROLE_DISPLAY_MAP[role.role as keyof typeof ROLE_DISPLAY_MAP] || role.role}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onFaucet(role.account)}
                      className="h-8"
                    >
                      <Coins className="h-4 w-4 mr-1" />
                      Faucet
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onCopyAddress(role.account)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Address
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            window.open(`https://solscan.io/account/${role.account}`, '_blank')
                          }
                        >
                          <SquareArrowOutUpRight className="mr-2 h-4 w-4" />
                          View on Explorer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
