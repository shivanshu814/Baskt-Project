'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Plus } from 'lucide-react';
import { AddOracleModal } from './AddOracleModal';

type Oracle = {
  id: string;
  name: string;
  type: 'Pyth' | 'Switchboard' | 'Custom';
  address: string;
  lastUpdateTime: string;
  status: 'active' | 'stale' | 'error';
};

export function OraclesList() {
  const [showAddOracleModal, setShowAddOracleModal] = useState(false);
  const oracles: Oracle[] = [];

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl text-white font-semibold">Oracle Feeds</h2>
        <Button onClick={() => setShowAddOracleModal(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Oracle
        </Button>
      </div>

      <div className="rounded-md border border-white/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Last Update</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {oracles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <p className="text-white/60 text-sm">No oracles found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              oracles.map((oracle) => (
                <TableRow key={oracle.id}>
                  <TableCell className="font-medium">{oracle.name}</TableCell>
                  <TableCell>{oracle.type}</TableCell>
                  <TableCell
                    className="font-mono text-xs truncate max-w-[150px]"
                    title={oracle.address}
                  >
                    {oracle.address}
                  </TableCell>
                  <TableCell>{oracle.lastUpdateTime}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        oracle.status === 'active'
                          ? 'bg-green-500/10 text-green-500 border-green-500/20'
                          : oracle.status === 'stale'
                            ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                            : 'bg-red-500/10 text-red-500 border-red-500/20'
                      }
                    >
                      {oracle.status === 'active'
                        ? 'Active'
                        : oracle.status === 'stale'
                          ? 'Stale'
                          : 'Error'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-[#1a1f2e] text-white hover:bg-[#1a1f2e]/90 hover:text-white rounded-lg border-white/10"
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-[#1a1f2e] text-white hover:bg-[#1a1f2e]/90 hover:text-white rounded-lg border-white/10"
                      >
                        Update
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AddOracleModal
        open={showAddOracleModal}
        onOpenChange={setShowAddOracleModal}
        onOracleAdded={() => setShowAddOracleModal(false)}
      />
    </>
  );
}
