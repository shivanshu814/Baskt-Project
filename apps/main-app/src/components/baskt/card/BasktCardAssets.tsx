'use client';

import {
  NumberFormat,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@baskt/ui';
import React, { useCallback } from 'react';
import { BasktCardAssetsProps, ExtendedAssetInfo } from '../../../types/baskt';
import { generateAssetUrl, handleAssetClick } from '../../../utils/asset/asset';
import { AssetLogo } from '../../create-baskt/assetModal/AssetLogo';

export const BasktCardAssets = React.memo(({ assets }: BasktCardAssetsProps) => {
  const generateAssetUrlMemo = useCallback((asset: ExtendedAssetInfo) => {
    return generateAssetUrl(asset);
  }, []);

  const handleAssetClickMemo = useCallback((asset: ExtendedAssetInfo) => {
    handleAssetClick(asset);
  }, []);

  return (
    <div className="mt-4">
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-tertiary">Assets</h3>
      </div>
      <div className="rounded-sm border border-border bg-muted/10">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead className="text-left">
                Asset
                <span className="ml-2 text-xs text-muted-foreground font-normal">
                  ({assets?.length ?? 0})
                </span>
              </TableHead>
              <TableHead className="text-center">Price</TableHead>
              <TableHead className="text-center">Direction</TableHead>
              <TableHead className="text-center whitespace-nowrap">Target Weight</TableHead>
              <TableHead className="text-right whitespace-nowrap">Current Weight</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(assets || []).map((asset: ExtendedAssetInfo) => {
              const assetUrl = generateAssetUrlMemo(asset);
              return (
                <TableRow key={`${asset.ticker}`}>
                  <TableCell className="flex items-center">
                    <span className="mr-2">
                      <AssetLogo
                        ticker={asset.name || asset.ticker || '---'}
                        logo={asset.logo || ''}
                        size="sm"
                      />
                    </span>
                    <button
                      onClick={() => handleAssetClickMemo(asset)}
                      disabled={!assetUrl}
                      className={`truncate font-medium ${
                        assetUrl ? 'hover:underline cursor-pointer' : 'cursor-default'
                      }`}
                    >
                      {asset.name || asset.ticker || '---'}
                    </button>
                  </TableCell>
                  <TableCell className="text-center">
                    {asset.price !== undefined ? (
                      <NumberFormat value={asset.price} isPrice={true} showCurrency={true} />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={asset.direction ? 'text-green-600' : 'text-red-600'}>
                      {asset.direction ? 'Long' : 'Short'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {asset.weight !== undefined ? <NumberFormat value={asset.weight} /> : '-'}%
                  </TableCell>
                  <TableCell className="text-right">
                    {asset.currentWeight !== undefined ? (
                      <NumberFormat value={asset.currentWeight} />
                    ) : (
                      '-'
                    )}
                    %
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
});

BasktCardAssets.displayName = 'BasktCardAssets';
