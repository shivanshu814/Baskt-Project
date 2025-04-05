'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

type Asset = {
  id: string;
  ticker: string;
  oracleType: string;
  oracleAddress: string;
  allowLong: boolean;
  allowShort: boolean;
  status: 'active' | 'inactive';
};

export function AdminAssetsList() {
  const [assets, setAssets] = useState<Asset[]>([]);

  const handleToggleLong = (assetId: string) => {
    setAssets(
      assets.map((asset) => {
        if (asset.id === assetId) {
          return { ...asset, allowLong: !asset.allowLong };
        }
        return asset;
      }),
    );
  };

  const handleToggleShort = (assetId: string) => {
    setAssets(
      assets.map((asset) => {
        if (asset.id === assetId) {
          return { ...asset, allowShort: !asset.allowShort };
        }
        return asset;
      }),
    );
  };

  return (
    <div className="rounded-md border border-white/10">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticker</TableHead>
            <TableHead>Oracle Type</TableHead>
            <TableHead>Oracle Address</TableHead>
            <TableHead>Allow Long</TableHead>
            <TableHead>Allow Short</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-32 text-center">
                <div className="flex flex-col items-center justify-center gap-2">
                  <p className="text-white/60 text-sm">No assets found</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            assets.map((asset) => (
              <TableRow key={asset.id}>
                <TableCell className="font-medium">{asset.ticker}</TableCell>
                <TableCell>{asset.oracleType}</TableCell>
                <TableCell
                  className="font-mono text-xs truncate max-w-[150px]"
                  title={asset.oracleAddress}
                >
                  {asset.oracleAddress}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={asset.allowLong}
                    onCheckedChange={() => handleToggleLong(asset.id)}
                    className="data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-white"
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={asset.allowShort}
                    onCheckedChange={() => handleToggleShort(asset.id)}
                    className="data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-white"
                  />
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      asset.status === 'active'
                        ? 'bg-green-500/10 text-green-500 border-green-500/20'
                        : 'bg-red-500/10 text-red-500 border-red-500/20'
                    }
                  >
                    {asset.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-[#1a1f2e] text-white hover:bg-[#1a1f2e]/90 hover:text-white rounded-lg border-white/10"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent text-red-400 border border-red-400/20 hover:bg-red-400/10 hover:text-red-400 rounded-lg"
                    >
                      Disable
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
