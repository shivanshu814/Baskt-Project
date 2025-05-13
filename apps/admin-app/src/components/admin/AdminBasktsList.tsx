// AdminBasktsList.tsx
'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { trpc } from '../../utils/trpc';
import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { useBasktClient } from '@baskt/ui';
import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { BasktMetadataModel } from '@baskt/types';

export function AdminBasktsList() {
  const { data: trpcResponse, isLoading, error } = trpc.baskt.getAllBaskts.useQuery();
  const [activatingBasktId, setActivatingBasktId] = useState<string | null>(null);
  const { client } = useBasktClient();
  const basktList = trpcResponse && trpcResponse.success ? (trpcResponse as { data: BasktMetadataModel[] }).data : [];

  // Placeholder for activation logic (to be replaced with actual mutation)
  const activateBaskt = async (basktId: string) => {
    setActivatingBasktId(basktId);

    const basktInfo = basktList.find((baskt: any) => baskt.basktId === basktId);

    if (!basktInfo) {
      console.error('Baskt not found');
      return;
    }

    await client?.activateBaskt(
      new PublicKey(basktId),
      basktInfo.assets.map((asset: any) => new anchor.BN(asset.priceRaw))
    )

    setTimeout(() => setActivatingBasktId(null), 1000); // Simulate delay
  };

  return (
    <div className="rounded-md border border-white/10 mt-6">
      {error && (
        <div className="p-4 bg-red-500/10 border-b border-red-500/20">
          <p className="text-red-500 text-sm">{error.message}</p>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Baskt Name</TableHead>
            <TableHead>Baskt Address</TableHead>
            <TableHead>Active</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={3} className="h-32 text-center">
                <div className="flex flex-col items-center justify-center gap-2">
                  <p className="text-white/60 text-sm">Loading baskts...</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            basktList.length ? (
              basktList.map((baskt: any) => (
                <TableRow key={baskt.basktId}>
                  <TableCell>{baskt.name || 'Unnamed'}</TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-white/80">{baskt.basktId}</span>
                  </TableCell>
                  <TableCell>{baskt.account.isActive ? 'Yes' : 'No'}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded hover:bg-white/10"><MoreHorizontal className="w-5 h-5 text-white/60" /></button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => activateBaskt(baskt.basktId)}
                          disabled={activatingBasktId === baskt.basktId}
                        >
                          {activatingBasktId === baskt.basktId ? 'Activating...' : 'Activate'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-white/60">No baskts found.</TableCell>
              </TableRow>
            )
          )}
        </TableBody>
      </Table>
    </div>
  );
}
