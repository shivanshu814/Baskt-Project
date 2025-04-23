'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { trpc } from '../../utils/trpc';
import { getSolscanAddressUrl } from '@baskt/ui';
import { useEffect } from 'react';


export function AdminAssetsList() {
  const { data: assets, isLoading, error } = trpc.asset.getAllAssetsWithConfig.useQuery();

  useEffect(() => {
    if (!assets) {
      return;
    }
    console.log(assets);
  }, [assets]);

  return (
    <div className="rounded-md border border-white/10">
      {error && (
        <div className="p-4 bg-red-500/10 border-b border-red-500/20">
          <p className="text-red-500 text-sm">{error.message}</p>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticker</TableHead>
            <TableHead>Asset Address</TableHead>
            <TableHead>Listing Time</TableHead>
            <TableHead>Asset Price</TableHead>
            <TableHead>Allow Long</TableHead>
            <TableHead>Allow Short</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={10} className="h-32 text-center">
                <div className="flex flex-col items-center justify-center gap-2">
                  <p className="text-white/60 text-sm">Loading assets...</p>
                </div>
              </TableCell>
            </TableRow>
          ) : assets?.data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-32 text-center">
                <div className="flex flex-col items-center justify-center gap-2">
                  <p className="text-white/60 text-sm">No assets found</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            assets?.data?.map((asset) => (
              <TableRow key={asset.account.address.toString()}>
                <TableCell className="font-medium">{asset.ticker}</TableCell>
                <TableCell className="font-mono text-xs">
                  <a
                    href={getSolscanAddressUrl(asset.account.address.toString())}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    {asset.account.address.toString().slice(0, 8)}...
                    {asset.account.address.toString().slice(-8)}
                  </a>
                </TableCell>
                <TableCell>{asset.account.listingTime.toLocaleString()}</TableCell>
                <TableCell>10</TableCell>
                <TableCell>{asset.account.permissions.allowLongs ? 'Yes' : 'No'}</TableCell>
                <TableCell>{asset.account.permissions.allowShorts ? 'Yes' : 'No'}</TableCell>
                <TableCell>{asset.account.isActive ? 'Active' : 'Inactive'}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
