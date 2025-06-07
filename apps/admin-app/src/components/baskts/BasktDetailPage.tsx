'use client';

import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ArrowLeft } from 'lucide-react';
import { BN } from 'bn.js';
import { formatTimestamp, formatNumber } from '../../utils/format';
import { BasktData } from '../../types/baskt';
import { FundingIndexTable } from './FundingIndexTable';

interface BasktDetailPageProps {
  baskt: BasktData;
  onBack: () => void;
}

export function BasktDetailPage({ baskt, onBack }: BasktDetailPageProps) {

  const { account } = baskt;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <Button onClick={onBack} variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">{baskt.name || account.basktName || 'Unnamed Baskt'}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/60">Price:</span>
          <span className="text-lg font-medium">{formatNumber(baskt.price || 0)}</span>
          <span className={(baskt.change24h || 0) >= 0 ? 'text-green-500' : 'text-red-500'}>
            {formatNumber(baskt.change24h || 0, { suffix: '%' })}
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
                <span className="font-mono text-sm">{baskt.basktId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Creator:</span>
                <span className="font-mono text-sm">{account.creator.toString()}</span>
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
                <span>{formatNumber(new BN(account.baselineNav).toNumber())}</span>
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
                <span>{account.oracle?.price ? formatNumber(new BN(account.oracle.price).toNumber()) : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Max Price Age (sec):</span>
                <span>{account.oracle?.maxPriceAgeSec || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Publish Time:</span>
                <span>{account.oracle?.publishTime ? formatTimestamp(new BN(account.oracle.publishTime).toNumber()) : 'N/A'}</span>
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
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2">Asset</th>
                      <th className="text-right py-2">Weight</th>
                      <th className="text-right py-2">Direction</th>
                      <th className="text-right py-2">Baseline Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {account.currentAssetConfigs.map((asset, index) => (
                      <tr key={index} className="border-b border-white/5">
                        <td className="py-2 font-mono text-xs">
                          {asset.assetId.toString()}
                        </td>
                        <td className="py-2 text-right">{asset.weight.toString()}</td>
                        <td className="py-2 text-right">
                          {asset.direction ? 'Long' : 'Short'}
                        </td>
                        <td className="py-2 text-right">
                          {formatNumber(new BN(asset.baselinePrice).toNumber())}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
