'use client';

import { Button, NumberFormat, PublicKeyText, TableCell, TableRow } from '@baskt/ui';
import { Eye, Power } from 'lucide-react';
import { BasktRowProps } from '../../types/baskt';

export function BasktRow({ baskt, onActivate, isActivating, onViewDetails }: BasktRowProps) {
  const basktData = baskt as any;
  const name = baskt.name || 'Unnamed Baskt';
  const assetsDisplay = baskt.assets?.length > 0 ? `${baskt.assets.length} assets` : 'No assets';
  const price = baskt.price || 0;
  const status = basktData.status || 'pending';
  const isActive = status === 'active';
  const openPositions = basktData.openPositions || 0;
  const change24h = basktData.stats?.change24h || 0;

  return (
    <TableRow key={baskt.basktId}>
      <TableCell className="font-medium">
        <PublicKeyText publicKey={baskt.basktId} isCopy={true} noFormat={false} />
      </TableCell>
      <TableCell className="font-medium">{name}</TableCell>
      <TableCell>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}
        >
          {status}
        </span>
      </TableCell>
      <TableCell className="text-sm text-white/70">{assetsDisplay}</TableCell>
      <TableCell>
        <NumberFormat value={price} isPrice={true} showCurrency={true} />
      </TableCell>
      <TableCell>
        <span className={`text-sm ${change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {change24h >= 0 ? '+' : ''}
          {change24h}%
        </span>
      </TableCell>
      <TableCell className="text-center">{openPositions}</TableCell>
      <TableCell className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => onViewDetails?.(baskt.basktId)}>
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>

        <Button
          variant={isActive ? 'secondary' : 'default'}
          size="sm"
          onClick={() => onActivate(baskt.basktId)}
          disabled={isActivating || isActive}
        >
          <Power className="h-4 w-4 mr-1" />
          {isActivating ? 'Activating...' : isActive ? 'Active' : 'Activate'}
        </Button>
      </TableCell>
    </TableRow>
  );
}
