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

const mockOracles: Oracle[] = [
  {
    id: '1',
    name: 'BTC/USD Price Feed',
    type: 'Pyth',
    address: '8ibFbzbAKTTQjECGDtjVfGEMwvQSKYARrm4FUcxbPPBW',
    lastUpdateTime: '2 minutes ago',
    status: 'active',
  },
  {
    id: '2',
    name: 'ETH/USD Price Feed',
    type: 'Switchboard',
    address: 'CrZCEJdAkWvz2pv1gQ4HJ6Rvnm4N4NBBi2Q6mPC7PwEF',
    lastUpdateTime: '5 minutes ago',
    status: 'active',
  },
  {
    id: '3',
    name: 'SOL/USD Price Feed',
    type: 'Custom',
    address: '5aBLm4P1L1qGhVnKMULwAKnTEcnwzd22x3HSFhoqwmJo',
    lastUpdateTime: '30 minutes ago',
    status: 'stale',
  },
];

export function OraclesList() {
  const [showAddOracleModal, setShowAddOracleModal] = useState(false);

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Oracle Feeds</h2>
        <Button onClick={() => setShowAddOracleModal(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Oracle
        </Button>
      </div>

      <div className="rounded-md border">
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
            {mockOracles.map((oracle) => (
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
                    variant={oracle.status === 'active' ? 'default' : 'outline'}
                    className={
                      oracle.status === 'active'
                        ? 'bg-green-500'
                        : oracle.status === 'stale'
                          ? 'bg-yellow-500'
                          : 'bg-destructive'
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
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      Update
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
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
