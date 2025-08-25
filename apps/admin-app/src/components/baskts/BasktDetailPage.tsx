'use client';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  NumberFormat,
  PublicKeyText,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@baskt/ui';
import { ArrowLeft } from 'lucide-react';
import { BasktDetailPageProps } from '../../types/baskt';
import { formatTimestamp } from '../../utils/format';

export function BasktDetailPage({ baskt, onBack }: BasktDetailPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <Button onClick={onBack} variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">{baskt.name || 'Unnamed Baskt'}</h2>
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
        <Card className="!bg-white/5 border border-border rounded-md">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
              <div className="flex justify-between">
                <span className="text-white/60">Baskt ID:</span>
                <span className="font-mono text-sm">
                  <PublicKeyText publicKey={baskt.basktId} isCopy={true} />
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Creator:</span>
                <span className="font-mono text-sm">
                  <PublicKeyText publicKey={baskt.creator} isCopy={true} />
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Public:</span>
                <span>{baskt.isPublic ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Status:</span>
                <span className="capitalize">{baskt.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Open Positions:</span>
                <span>{baskt.openPositions}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance & Stats */}
        <Card className="!bg-white/5 border border-border rounded-md">
          <CardHeader>
            <CardTitle>Performance & Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
              <div className="flex justify-between">
                <span className="text-white/60">AUM:</span>
                <span>
                  <NumberFormat value={baskt.aum || 0} isPrice={true} />
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">24h Change:</span>
                <span className={(baskt.change24h || 0) >= 0 ? 'text-green-500' : 'text-red-500'}>
                  <NumberFormat value={baskt.change24h || 0} />%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">7d Change:</span>
                <span
                  className={(baskt.stats?.change7d || 0) >= 0 ? 'text-green-500' : 'text-red-500'}
                >
                  <NumberFormat value={baskt.stats?.change7d || 0} />%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">30d Change:</span>
                <span
                  className={(baskt.stats?.change30d || 0) >= 0 ? 'text-green-500' : 'text-red-500'}
                >
                  <NumberFormat value={baskt.stats?.change30d || 0} />%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="!bg-white/5 border border-border rounded-md">
          <CardHeader>
            <CardTitle>Rebalancing Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
              <div className="flex justify-between">
                <span className="text-white/60">Last Rebalance Time:</span>
                <span>{formatTimestamp(baskt.lastRebalanceTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Baseline NAV:</span>
                <span>
                  <NumberFormat value={Number(baskt.baselineNav) || 0} isPrice={true} />
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Rebalance Period:</span>
                <span>{baskt.rebalancePeriod || 'N/A'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="!bg-white/5 border border-border rounded-md">
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
              <div className="flex justify-between">
                <span className="text-white/60">Opening Fee:</span>
                <span>{baskt.config?.openingFeeBps || 0} bps</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Closing Fee:</span>
                <span>{baskt.config?.closingFeeBps || 0} bps</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Liquidation Fee:</span>
                <span>{baskt.config?.liquidationFeeBps || 0} bps</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Min Collateral Ratio:</span>
                <span>{baskt.config?.minCollateralRatioBps || 0} bps</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Asset Configurations */}
        <Card className="md:col-span-2 !bg-white/5 border border-border rounded-md">
          <CardHeader>
            <CardTitle>Asset Configurations ({baskt.currentAssetConfigs?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {baskt.currentAssetConfigs?.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead className="text-right">Weight</TableHead>
                      <TableHead className="text-right">Direction</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Baseline Price</TableHead>
                      <TableHead className="text-right">Current Price</TableHead>
                      <TableHead className="text-right">24h Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {baskt.currentAssetConfigs.map((asset, index) => {
                      const assetInfo = baskt.assets?.find((a) => a.assetAddress === asset.assetId);
                      return (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-xs">
                            <div className="flex items-center gap-2">
                              {assetInfo?.logo && (
                                <img
                                  src={assetInfo.logo}
                                  alt={assetInfo.ticker}
                                  className="w-6 h-6 rounded-full"
                                />
                              )}
                              <div>
                                <div className="font-medium">{assetInfo?.ticker || 'Unknown'}</div>
                                <PublicKeyText publicKey={asset.assetId} isCopy={true} />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {parseFloat(asset.weight.toString()) / 1e2}%
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={asset.direction ? 'text-green-500' : 'text-red-500'}>
                              {asset.direction ? 'Long' : 'Short'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <NumberFormat value={parseInt(asset.baselinePrice)} isPrice />
                          </TableCell>
                          <TableCell className="text-right">
                            <NumberFormat value={assetInfo?.price || 0} isPrice />
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={
                                (assetInfo?.change24h || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                              }
                            >
                              <NumberFormat value={assetInfo?.change24h || 0} />%
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center text-white/60 py-4">No assets configured</div>
            )}
          </CardContent>
        </Card>

        {/* Transaction Signatures */}
        <Card className="md:col-span-2 !bg-white/5 border border-border rounded-md">
          <CardHeader>
            <CardTitle>Transaction Signatures</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
              {baskt.creationTxSignature && (
                <div className="flex justify-between">
                  <span className="text-white/60">Creation:</span>
                  <span className="font-mono text-xs break-all max-w-xs">
                    {baskt.creationTxSignature}
                  </span>
                </div>
              )}
              {baskt.activateBasktTxSignature && (
                <div className="flex justify-between">
                  <span className="text-white/60">Activation:</span>
                  <span className="font-mono text-xs break-all max-w-xs">
                    {baskt.activateBasktTxSignature}
                  </span>
                </div>
              )}
              {baskt.decomissionBasktTxSignature && (
                <div className="flex justify-between">
                  <span className="text-white/60">Decommission:</span>
                  <span className="font-mono text-xs break-all max-w-xs">
                    {baskt.decomissionBasktTxSignature}
                  </span>
                </div>
              )}
              {baskt.closeBasktTxSignature && (
                <div className="flex justify-between">
                  <span className="text-white/60">Close:</span>
                  <span className="font-mono text-xs break-all max-w-xs">
                    {baskt.closeBasktTxSignature}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
