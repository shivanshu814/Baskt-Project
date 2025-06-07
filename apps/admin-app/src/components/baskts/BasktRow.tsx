'use client';

import { TableCell, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Eye, Power } from 'lucide-react';
import { BasktRowProps } from '../../types/baskt';

export function BasktRow({ baskt, onActivate, isActivating, onViewDetails }: BasktRowProps) {
  const { account } = baskt;
  const name = baskt.name || account.basktName || 'Unnamed Baskt';
  
  return (
    <TableRow key={baskt.basktId}>
      <TableCell className="font-medium">{name}</TableCell>
      <TableCell>
        <span className="font-mono text-xs text-white/80">{baskt.basktId}</span>
      </TableCell>
      <TableCell className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewDetails?.(baskt.basktId)}
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
        
        <Button
          variant={account.isActive ? "secondary" : "default"}
          size="sm"
          onClick={() => onActivate(baskt.basktId)}
          disabled={isActivating || account.isActive}
        >
          <Power className="h-4 w-4 mr-1" />
          {isActivating ? 'Activating...' : (account.isActive ? 'Active' : 'Activate')}
        </Button>
      </TableCell>
    </TableRow>
  );
}
