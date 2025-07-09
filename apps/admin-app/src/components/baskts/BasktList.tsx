'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@baskt/ui';
import { BasktListProps, BasktData } from '../../types/baskt';
import { BasktRow } from './BasktRow';
import { useBaskts } from '../../hooks/baskts/useBaskts';
import { toast } from 'sonner';
import { useEffect } from 'react';

export function BasktList({ onActivate, activatingBasktId, onViewDetails }: BasktListProps) {
  const { basktList, isLoading, error } = useBaskts();

  useEffect(() => {
    if (error) {
      toast.error(error.message || 'An error occurred while loading baskts.');
    }
  }, [error]);

  const validBaskts = basktList.filter((baskt): baskt is BasktData => {
    return (
      baskt !== null &&
      baskt !== undefined &&
      !!baskt.basktId &&
      typeof baskt.basktId === 'string' &&
      !!baskt.account
    );
  });

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border-b border-red-500/20">
        <p className="text-red-500 text-sm">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-white/10 mt-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Baskt Name</TableHead>
            <TableHead>Baskt Address</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow key="loading">
              <TableCell colSpan={3} className="h-32 text-center">
                <div className="flex flex-col items-center justify-center gap-2">
                  <p className="text-white/60 text-sm">Loading baskts...</p>
                </div>
              </TableCell>
            </TableRow>
          ) : validBaskts.length > 0 ? (
            validBaskts.map((baskt) => {
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
              <TableCell colSpan={3} className="text-center text-white/60">
                No baskts found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
