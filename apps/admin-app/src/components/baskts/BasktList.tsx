'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@baskt/ui';
import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useBaskts } from '../../hooks/baskts/useBaskts';
import { BasktData, BasktListProps } from '../../types/baskt';
import { BasktRow } from './BasktRow';

export function BasktList({ onActivate, activatingBasktId, onViewDetails }: BasktListProps) {
  const { basktList, isLoading, error } = useBaskts();

  useEffect(() => {
    if (error) {
      toast.error(error.message || 'An error occurred while loading baskts.');
    }
  }, [error]);

  const validBaskts = basktList.filter((baskt: any): baskt is BasktData => {
    return (
      baskt !== null && baskt !== undefined && !!baskt.basktId && typeof baskt.basktId === 'string'
    );
  });

  // Calculate baskt counts
  const basktCounts = useMemo(() => {
    const total = validBaskts.length;
    const active = validBaskts.filter((baskt: any) => baskt.isActive).length;
    return { total, active };
  }, [validBaskts]);

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border-b border-red-500/20">
        <p className="text-red-500 text-sm">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mt-2 text-2xl font-bold text-white">Baskts ({basktCounts.total})</h2>
          <p className="text-white/60 mt-1">Manage and monitor all baskts in the system</p>
        </div>
      </div>

      <div className="rounded-md border border-white/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Baskt ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assets</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Change 24h</TableHead>
              <TableHead>Open Positions</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow key="loading">
                <TableCell colSpan={8} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <p className="text-white/60 text-sm">Loading baskts...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : validBaskts.length > 0 ? (
              validBaskts.map((baskt: any) => {
                const key = baskt.basktId || `baskt-${Math.random()}`;
                return (
                  <BasktRow
                    key={key}
                    baskt={baskt}
                    onActivate={onActivate}
                    isActivating={activatingBasktId === baskt.basktId}
                    onViewDetails={onViewDetails}
                  />
                );
              })
            ) : (
              <TableRow key="empty">
                <TableCell colSpan={8} className="text-center text-white/60">
                  No baskts found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
