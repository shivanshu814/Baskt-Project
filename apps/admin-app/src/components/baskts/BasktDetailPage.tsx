'use client';

import { Button } from '@baskt/ui';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  NumberFormat,
  PublicKeyText,
} from '@baskt/ui';
import { ArrowLeft } from 'lucide-react';
import { BN } from 'bn.js';
import { formatTimestamp } from '../../utils/format';
import { FundingIndexTable } from './FundingIndexTable';
import { BasktDetailPageProps } from '../../types/baskt';

export function BasktDetailPage({ baskt, onBack }: BasktDetailPageProps) {
  const { account } = baskt;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <Button onClick={onBack} variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">
            {baskt.name || account.basktName || 'Unnamed Baskt'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/60">Price:</span>
          <span className="text-lg font-medium">
            <NumberFormat value={baskt.price || 0} isPrice={true} />
          </span>
          <span className={(baskt.change24h || 0) >= 0 ? 'text-green-500' : 'text-red-500'}>
            <NumberFormat value={baskt.change24h || 0} />%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
              <div className="flex justify-between">
                <span className="text-white/60">Baskt ID:</span>
                <span className="font-mono text-sm">
                  <PublicKeyText publicKey={baskt.basktId} isCopy={true} noFormat={true} />
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Creator:</span>
                <span className="font-mono text-sm">
                  <PublicKeyText
                    publicKey={account.creator.toString()}
                    isCopy={true}
                    noFormat={true}
                  />
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Public:</span>
                <span>{account.isPublic ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Created:</span>
                <span>{formatTimestamp(new BN(account.creationTime).toNumber())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Active:</span>
                <span>{account.isActive ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rebalancing Information */}
        <Card>
          <CardHeader>
            <CardTitle>Rebalance History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
              <div className="flex justify-between">
                <span className="text-white/60">Last Rebalance Index:</span>
                <span>{account.lastRebalanceIndex?.toString() || '0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Last Rebalance Time:</span>
                <span>{formatTimestamp(new BN(account.lastRebalanceTime).toNumber())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Baseline NAV:</span>
                <span>
                  <NumberFormat value={new BN(account.baselineNav).toNumber()} isPrice={true} />
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Oracle Parameters */}
        <Card>
          <CardHeader>
            <CardTitle>Oracle Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
              <div className="flex justify-between">
                <span className="text-white/60">Price:</span>
                <span>
                  $
                  {account.oracle?.price ? (
                    <NumberFormat value={new BN(account.oracle.price).toNumber()} />
                  ) : (
                    'N/A'
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Max Price Age (sec):</span>
                <span>{account.oracle?.maxPriceAgeSec || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Publish Time:</span>
                <span>
                  {account.oracle?.publishTime
                    ? formatTimestamp(new BN(account.oracle.publishTime).toNumber())
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Bump:</span>
                <span>{account.bump}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Asset Configurations */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Asset Configurations ({account.currentAssetConfigs?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {account.currentAssetConfigs?.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead className="text-right">Weight</TableHead>
                      <TableHead className="text-right">Direction</TableHead>
                      <TableHead className="text-right">Baseline Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {account.currentAssetConfigs.map((asset, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-xs">
                          <PublicKeyText
                            publicKey={asset.assetId.toString()}
                            isCopy={true}
                            noFormat={true}
                          />
                        </TableCell>
                        <TableCell className="text-right">{asset.weight.toString()}</TableCell>
                        <TableCell className="text-right">
                          {asset.direction ? 'Long' : 'Short'}
                        </TableCell>
                        <TableCell className="text-right">
                          <NumberFormat
                            value={new BN(asset.baselinePrice).toNumber()}
                            isPrice={true}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center text-white/60 py-4">No assets configured</div>
            )}
          </CardContent>
        </Card>

        {/* Funding Index */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Funding Index</CardTitle>
          </CardHeader>
          <CardContent>
            <FundingIndexTable basktId={baskt.basktId} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
