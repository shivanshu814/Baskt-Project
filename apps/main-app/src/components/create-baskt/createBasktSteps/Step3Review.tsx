'use client';

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, NumberFormat } from '@baskt/ui';
import { Sparkles } from 'lucide-react';
import { useStep3Review } from '../../../hooks/create-baskt/steps/use-step-3-review';
import { Step3ReviewProps } from '../../../types/baskt/creation';
import { formatRebalancingDisplay } from '../../../utils/baskt/baskt';
import { AssetLogo } from '../assetModal/AssetLogo';

export function Step3Review({ formData, selectedAssets, assetDetails }: Step3ReviewProps) {
  const { authenticated, login, wallet, basktClient } = useStep3Review();

  // show wallet connection button if not connected
  if (!authenticated || !wallet || !basktClient) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Connect Wallet to Launch Baskt
          </h2>
          <p className="text-muted-foreground text-lg">
            You need to connect your wallet to create a baskt.
          </p>
        </div>

        <Card className="bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm border border-border/30 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <div className="text-6xl mb-4">🔗</div>
              <h3 className="text-xl font-semibold">Wallet Connection Required</h3>
              <p className="text-muted-foreground">
                Please connect your wallet to proceed with baskt creation.
              </p>
              <Button onClick={login} size="lg" className="mt-4">
                Connect Wallet
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Review Your Baskt
        </h2>
        <p className="text-muted-foreground text-lg">
          Please review your baskt configuration before creating it.
        </p>
      </div>

      {/* baskt summary card */}
      <Card className="bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm border border-border/30 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <CardTitle className="text-lg font-bold text-white">
                {formData.name}{' '}
                <span className="ml-2 text-sm font-medium text-primary capitalize bg-primary/10 px-2 py-1 rounded-sm">
                  {formData.visibility}
                </span>
              </CardTitle>
            </div>
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-blue-400"></div>
                </div>
                <span className="text-sm text-muted-foreground">Rebalancing</span>
              </div>
              <span className="font-semibold text-sm text-white">
                {formatRebalancingDisplay(
                  formData.rebalancingType,
                  formData.rebalancingPeriod,
                  formData.rebalancingUnit,
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* assets table */}
      {/* note: using custom table instead of shadcn table component because we need sticky header on scroll */}
      {assetDetails.length > 0 && (
        <Card className="bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm border border-border/30 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-card/60 to-card/40 border-b border-border/30">
            <CardTitle className="text-lg font-semibold text-white">Selected Assets</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Review your asset allocation and positions
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-card/50 backdrop-blur-sm z-10">
                  <tr className="border-b border-border/30">
                    <th className="text-left p-4 font-semibold text-sm text-muted-foreground">
                      Asset
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-muted-foreground">
                      Price
                    </th>
                    <th className="whitespace-nowrap text-left p-4 font-semibold text-sm text-muted-foreground">
                      Weight %
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-muted-foreground">
                      Position
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {assetDetails.map((assetDetail, index) => {
                    const selectedAsset = selectedAssets.find(
                      (asset) => asset.ticker === assetDetail.ticker,
                    );

                    return (
                      <tr key={index} className="hover:bg-card/20 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <AssetLogo
                              ticker={assetDetail.ticker}
                              logo={selectedAsset?.logo || ''}
                              size="md"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-sm text-white truncate">
                                {assetDetail.ticker}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {selectedAsset?.name && selectedAsset?.name.length > 40
                                  ? `${selectedAsset?.name.slice(
                                      0,
                                      5,
                                    )}...${selectedAsset?.name.slice(-8)}`
                                  : selectedAsset?.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-white">
                          {selectedAsset ? (
                            <NumberFormat
                              value={selectedAsset.price}
                              isPrice={true}
                              showCurrency={true}
                            />
                          ) : (
                            '$0.00'
                          )}
                        </td>
                        <td className="p-4 text-sm text-white">
                          {assetDetail.weight ? `${assetDetail.weight}%` : '0.00%'}
                        </td>
                        <td className="p-4">
                          <Badge
                            className={`${
                              assetDetail.position === 'long'
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                : 'bg-red-500/20 text-red-400 border-red-500/30'
                            } border rounded-sm pointer-events-none`}
                          >
                            {assetDetail.position === 'long' ? 'Long' : 'Short'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
