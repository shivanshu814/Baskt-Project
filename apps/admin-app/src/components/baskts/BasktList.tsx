'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { BasktListProps, BasktData } from '../../types/baskt';
import { BasktRow } from './BasktRow';
import { useBaskts } from '../../hooks/baskts/useBaskts';
import { BASKT_TABLE_HEADERS } from '../../config/baskt';

export function BasktList({ onActivate, activatingBasktId }: BasktListProps) {
  const { basktList, isLoading, error } = useBaskts();

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
            {BASKT_TABLE_HEADERS.map((header) => (
              <TableHead key={header.id}>{header.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={BASKT_TABLE_HEADERS.length} className="h-32 text-center">
                <div className="flex flex-col items-center justify-center gap-2">
                  <p className="text-white/60 text-sm">Loading baskts...</p>
                </div>
              </TableCell>
            </TableRow>
          ) : basktList.length ? (
            basktList.map((baskt: BasktData) => (
              <BasktRow
                key={baskt.basktId}
                baskt={baskt}
                onActivate={onActivate}
                isActivating={activatingBasktId === baskt.basktId}
              />
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={BASKT_TABLE_HEADERS.length} className="text-center text-white/60">
                No baskts found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
