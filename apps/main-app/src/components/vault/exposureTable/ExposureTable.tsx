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
import React from 'react';
import { ExposureTableProps } from '../../../types/vault';

export const ExposureTable = React.memo(({ allocationData }: ExposureTableProps) => {
  const isLoading = !allocationData;

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
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32">
                  <div className="flex items-center justify-center">
                    <Loading />
                  </div>
                </TableCell>
              </TableRow>
            ) : allocationData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32">
                  <div className="flex items-center justify-center">
                    <div className="text-muted-foreground">No allocation data available</div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              allocationData.map((asset, index) => (
                <TableRow key={`${asset.name}-${index}`}>
                  <TableCell className="flex items-center gap-3">
                    {asset.logo ? (
                      <Image
                        src={asset.logo}
                        alt={asset.name || 'Asset'}
                        className="w-7 h-7 rounded-full"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center"
                      style={{ display: asset.logo ? 'none' : 'flex' }}
                    >
                      <span className="text-xs font-bold text-primary">
                        {asset.name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">
                        {asset.name || 'Unknown Asset'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-foreground">
                      <NumberFormat
                        value={asset.longExposure / 10}
                        isPrice={true}
                        showCurrency={true}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {asset.longExposurePercentage}%
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-foreground">
                      <NumberFormat
                        value={asset.shortExposure / 10}
                        isPrice={true}
                        showCurrency={true}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {asset.shortExposurePercentage}%
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-foreground">
                      <NumberFormat
                        value={Math.abs(asset.netExposure) / 10}
                        isPrice={true}
                        showCurrency={true}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {asset.isLong ? 'Long' : 'Short'}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
});

ExposureTable.displayName = 'ExposureTable';
