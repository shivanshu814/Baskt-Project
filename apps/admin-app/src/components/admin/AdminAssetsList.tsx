'use client';

import { toast } from 'sonner';
import { Asset } from '@baskt/sdk';
import { useState, useEffect } from 'react';
import { useBasktClient } from '@baskt/ui';
import { getSolscanAddressUrl } from '../../utils/explorer';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

export function AdminAssetsList() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assetPrices, setAssetPrices] = useState<
    Record<string, { oracleValue: string; assetValue: string }>
  >({});

  const { client } = useBasktClient();

  useEffect(() => {
    const fetchAssets = async () => {
      if (!client) {
        setError('Client not initialized');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const assetsList = await client.getAllAssets();
        setAssets(assetsList);

        const initialPrices: Record<string, { oracleValue: string; assetValue: string }> = {};
        assetsList.forEach((asset) => {
          initialPrices[asset.address.toString()] = {
            oracleValue: 'Loading...',
            assetValue: 'Loading...',
          };
        });
        setAssetPrices(initialPrices);

        assetsList.forEach((asset) => fetchPrice(asset));
      } catch (error) {
        setError('Failed to fetch assets. Check console for details.');
        toast.error('Failed to fetch assets. Check console for details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssets();
  }, [client]);

  const fetchPrice = async (asset: Asset) => {
    if (!client) return;

    try {
      const priceObject = await client.getOraclePrice(asset.oracle.oracleAccount);
      const oraclePrice = priceObject.price.toNumber() / Math.pow(10, -priceObject.exponent);

      let assetPrice = 'Stale';
      try {
        const assetPriceResult = await client.getAssetPrice(
          asset.address,
          asset.oracle.oracleAccount,
        );

        if (assetPriceResult && assetPriceResult.price) {
          assetPrice = (
            assetPriceResult.price.toNumber() / Math.pow(10, -assetPriceResult.exponent)
          ).toString();
        }
      } catch (error) {
        toast.error('Failed to fetch asset price');
      }

      setAssetPrices((prev) => ({
        ...prev,
        [asset.address.toString()]: {
          oracleValue: oraclePrice.toString(),
          assetValue: assetPrice,
        },
      }));
    } catch (error) {
      setAssetPrices((prev) => ({
        ...prev,
        [asset.address.toString()]: {
          oracleValue: 'N/A',
          assetValue: 'Stale',
        },
      }));
    }
  };

  return (
    <div className="rounded-md border border-white/10">
      {error && (
        <div className="p-4 bg-red-500/10 border-b border-red-500/20">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticker</TableHead>
            <TableHead>Oracle Price</TableHead>
            <TableHead>Asset Price</TableHead>
            <TableHead>Oracle Type</TableHead>
            <TableHead>Oracle Address</TableHead>
            <TableHead>Max Age (s)</TableHead>
            <TableHead>Max Price Error</TableHead>
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
          ) : assets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-32 text-center">
                <div className="flex flex-col items-center justify-center gap-2">
                  <p className="text-white/60 text-sm">No assets found</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            assets.map((asset) => (
              <TableRow key={asset.address.toString()}>
                <TableCell className="font-medium">{asset.ticker}</TableCell>
                <TableCell>{assetPrices[asset.address.toString()]?.oracleValue || 'N/A'}</TableCell>
                <TableCell>
                  {assetPrices[asset.address.toString()]?.assetValue || 'Stale'}
                </TableCell>
                <TableCell>
                  {typeof asset.oracle.oracleType === 'string'
                    ? asset.oracle.oracleType
                    : JSON.stringify(asset.oracle.oracleType)}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  <a
                    href={getSolscanAddressUrl(asset.oracle.oracleAccount.toString())}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    {asset.oracle.oracleAccount.toString().slice(0, 8)}...
                    {asset.oracle.oracleAccount.toString().slice(-8)}
                  </a>
                </TableCell>
                <TableCell>{asset.oracle.maxPriceAgeSec}s</TableCell>
                <TableCell>{asset.oracle.maxPriceError.toString()}</TableCell>
                <TableCell>{asset.permissions.allowLongs ? 'Yes' : 'No'}</TableCell>
                <TableCell>{asset.permissions.allowShorts ? 'Yes' : 'No'}</TableCell>
                <TableCell>{asset.isActive ? 'Active' : 'Inactive'}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
