'use client';

import { useState, useEffect } from 'react';
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
import { Plus, Copy, Check } from 'lucide-react';
import { AddOracleModal } from './AddOracleModal';
import { UpdateOracleModal } from './UpdateOracleModal';
import { useBasktClient } from '../../providers/BasktClientProvider';
import { PublicKey } from '@solana/web3.js';
import { getSolscanAddressUrl } from '../../utils/explorer';
import { toast } from 'sonner';

type Oracle = {
  address: PublicKey;
  price: any; // BN type from anchor
  expo: number;
  conf: any; // BN type from anchor
  ema: any; // BN type from anchor
  publishTime: any; // BN type from anchor
  status: 'active' | 'stale' | 'error';
};

export function OraclesList() {
  const [showAddOracleModal, setShowAddOracleModal] = useState(false);
  const [showUpdateOracleModal, setShowUpdateOracleModal] = useState(false);
  const [selectedOracle, setSelectedOracle] = useState<Oracle | undefined>(undefined);
  const [oracles, setOracles] = useState<Oracle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const { client } = useBasktClient();

  const refreshOracles = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    const fetchOracles = async () => {
      if (!client) return;

      try {
        setIsLoading(true);
        const oraclesList = await client.getAllOracles();

        // Process the oracles and determine their status
        const processedOracles = oraclesList.map((oracle) => {
          // Calculate if the oracle is stale based on publish time
          // Current time in seconds
          const currentTime = Math.floor(Date.now() / 1000);
          // Oracle publish time is in seconds
          const publishTime = oracle.publishTime.toNumber();
          // If publish time is more than 5 minutes old, consider it stale
          const isStale = currentTime - publishTime > 300; // 5 minutes
          return {
            ...oracle,
            status: isStale ? ('stale' as const) : ('active' as const),
          };
        });
        setOracles(processedOracles);
      } catch (error) {
        console.error('Error fetching oracles:', error); //eslint-disable-line
      } finally {
        setIsLoading(false);
      }
    };

    fetchOracles();
  }, [client, refreshTrigger]); //eslint-disable-line

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
              <TableHead>Address</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Exponent</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>EMA</TableHead>
              <TableHead>Last Update</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <p className="text-white/60 text-sm">Loading oracles...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : oracles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <p className="text-white/60 text-sm">No oracles found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              oracles.map((oracle) => (
                <TableRow key={oracle.address.toString()}>
                  <TableCell className="font-mono text-xs">
                    <a
                      href={getSolscanAddressUrl(oracle.address.toString())}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {oracle.address.toString().slice(0, 8)}...
                      {oracle.address.toString().slice(-8)}
                    </a>
                  </TableCell>
                  <TableCell>{oracle.price.toString()}</TableCell>
                  <TableCell>{oracle.expo}</TableCell>
                  <TableCell>{oracle.conf.toString()}</TableCell>
                  <TableCell>{oracle.ema.toString()}</TableCell>
                  <TableCell>
                    {new Date(oracle.publishTime.toNumber() * 1000).toLocaleString()}
                  </TableCell>
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
                        onClick={() => {
                          const address = oracle.address.toString();
                          navigator.clipboard.writeText(address);
                          setCopiedAddress(address);
                          toast.success('Oracle address copied to clipboard', {
                            className: 'bg-[#010b1d] text-white border border-white/10',
                          });
                          setTimeout(() => setCopiedAddress(null), 2000);
                        }}
                      >
                        {copiedAddress === oracle.address.toString() ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-[#1a1f2e] text-white hover:bg-[#1a1f2e]/90 hover:text-white rounded-lg border-white/10"
                        onClick={() => {
                          setSelectedOracle(oracle);
                          setShowUpdateOracleModal(true);
                        }}
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
        onOracleAdded={() => {
          refreshOracles();
        }}
      />

      <UpdateOracleModal
        open={showUpdateOracleModal}
        onOpenChange={setShowUpdateOracleModal}
        onOracleUpdated={() => {
          refreshOracles();
        }}
        oracle={selectedOracle}
      />
    </>
  );
}
