'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { trpc } from '../../utils/trpc';
import { getSolscanAddressUrl } from '@baskt/ui';
import { Loading } from '../ui/loading';

import { AssetPriceHistoryPage } from './AssetPriceHistoryPage';
import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';


export function AdminAssetsList() {
  const { data: assets, isLoading, error } = trpc.asset.getAllAssetsWithConfig.useQuery();
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);

  if (selectedAsset) {
    return (
      <AssetPriceHistoryPage
        assetAddress={selectedAsset.account.address.toString()}
        assetName={selectedAsset.name || selectedAsset.ticker}
        assetLogo={selectedAsset.logo}
        ticker={selectedAsset.ticker}
        onBack={() => setSelectedAsset(null)}
      />
    );
  }

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
              <TableCell colSpan={10} className="h-32">
                <div className="flex items-center justify-center">
                  <Loading />
                </div>
              </TableCell>
            </TableRow>
          ) : assets?.data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="h-32">
                <div className="flex items-center justify-center">
                  <Loading />
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
                <TableCell>
                  {new Date(asset.account.listingTime).toLocaleString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true,
                  })}
                </TableCell>
                <TableCell>{asset.price} </TableCell>
                <TableCell>{asset.account.permissions.allowLongs ? 'Yes' : 'No'}</TableCell>
                <TableCell>{asset.account.permissions.allowShorts ? 'Yes' : 'No'}</TableCell>
                <TableCell>{asset.account.isActive ? 'Active' : 'Inactive'}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <MoreHorizontal size={18} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedAsset(asset)}>
                        View Prices
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
