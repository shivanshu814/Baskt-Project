'use client';
import {
  Loading,
  NumberFormat,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@baskt/ui';
import Image from 'next/image';
import React, { useMemo } from 'react';
import { useVaultExposureCalculations } from '../../../hooks/vault/use-vault-data';
import { AssetExposure } from '../../../types/vault';

const AssetExposureRow = React.memo<{ asset: AssetExposure }>(({ asset }) => {
  const { calculateExposurePercentages, getAssetImage, getProcessedAssetData } =
    useVaultExposureCalculations();
  const assetSymbol = asset.ticker || asset.name || 'Unknown';
  const assetImage = getAssetImage(asset);
  const { longExposure, shortExposure, netExposure } = getProcessedAssetData(asset);
  const { longPercentage, shortPercentage } = calculateExposurePercentages(
    longExposure,
    shortExposure,
  );

  return (
    <TableRow key={assetSymbol}>
      <TableCell className="flex items-center gap-3">
        <Image
          src={assetImage}
          alt={assetSymbol}
          className="w-7 h-7 rounded-full"
          width={28}
          height={28}
        />
        <div>
          <div className="font-semibold text-foreground">{assetSymbol}</div>
        </div>
      </TableCell>
      <TableCell>
        <div className="font-semibold text-foreground">
          <NumberFormat value={longExposure} isPrice={true} showCurrency={true} />
        </div>
        <div className="text-xs text-muted-foreground">{longPercentage}%</div>
      </TableCell>
      <TableCell>
        <div className="font-semibold text-foreground">
          <NumberFormat value={shortExposure} isPrice={true} showCurrency={true} />
        </div>
        <div className="text-xs text-muted-foreground">{shortPercentage}%</div>
      </TableCell>
      <TableCell>
        <div className="font-semibold text-foreground">
          <NumberFormat value={Math.abs(netExposure)} isPrice={true} showCurrency={true} />
        </div>
        <div className="text-xs text-muted-foreground">{netExposure >= 0 ? 'Long' : 'Short'}</div>
      </TableCell>
    </TableRow>
  );
});

AssetExposureRow.displayName = 'AssetExposureRow';

export const ExposureTable = React.memo(() => {
  const { assetExposureData, isLoading, error } = useVaultExposureCalculations();
  const tableContent = useMemo(() => {
    if (isLoading) {
      return (
        <TableRow>
          <TableCell colSpan={4} className="h-32">
            <div className="flex items-center justify-center">
              <Loading />
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (error) {
      return (
        <TableRow>
          <TableCell colSpan={4} className="h-32">
            <div className="flex items-center justify-center">
              <div className="text-red-500">Error: {error?.message}</div>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (assetExposureData.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={4} className="h-32">
            <div className="flex items-center justify-center">
              <div className="text-muted-foreground">No exposure data available</div>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    return assetExposureData.map((asset: AssetExposure) => (
      <AssetExposureRow
        key={asset.assetId || asset.ticker || asset.name || 'unknown'}
        asset={asset}
      />
    ));
  }, [assetExposureData, isLoading, error]);

  return (
    <div className="mt-4">
      <div className="rounded-md border border-foreground/10">
        <Table>
          <TableHeader>
            <TableRow className="bg-foreground/5">
              <TableHead className="px-4 py-3 font-semibold text-foreground/80 text-xs uppercase tracking-wider">
                Asset
              </TableHead>
              <TableHead className="px-4 py-3 font-semibold text-foreground/80 text-xs uppercase tracking-wider">
                Long Exposure
              </TableHead>
              <TableHead className="px-4 py-3 font-semibold text-foreground/80 text-xs uppercase tracking-wider">
                Short Exposure
              </TableHead>
              <TableHead className="px-4 py-3 font-semibold text-foreground/80 text-xs uppercase tracking-wider">
                Net Exposure
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{tableContent}</TableBody>
        </Table>
      </div>
    </div>
  );
});

ExposureTable.displayName = 'ExposureTable';
