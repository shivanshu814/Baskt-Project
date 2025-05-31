'use client';

import { TableCell, TableRow } from '../ui/table';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { BasktRowProps } from '../../types/baskt';

export function BasktRow({ baskt, onActivate, isActivating }: BasktRowProps) {
  return (
    <TableRow key={baskt.basktId}>
      <TableCell>{baskt.name || 'Unnamed'}</TableCell>
      <TableCell>
        <span className="font-mono text-xs text-white/80">{baskt.basktId}</span>
      </TableCell>
      <TableCell>{baskt.account.isActive ? 'Yes' : 'No'}</TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded hover:bg-white/10">
              <MoreHorizontal className="w-5 h-5 text-white/60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onActivate(baskt.basktId)} disabled={isActivating}>
              {isActivating ? 'Activating...' : 'Activate'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
