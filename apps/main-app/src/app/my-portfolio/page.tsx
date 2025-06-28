'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@baskt/ui';
import { useBasktClient } from '@baskt/ui';
import { trpc } from '../../utils/trpc';
import { PositionStatus } from '@baskt/types';
import BN from 'bn.js';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Package } from 'lucide-react';
import { NumberFormat } from '@baskt/ui';
import { PortfolioPosition, PortfolioSummary } from '../../types/portfolio';
import { AssetExposure } from '../../types/asset';

// Types for portfolio data

// Type for position data from API

type TabType = 'overview' | 'positions';

export default function PortfolioPage() {
  const { client } = useBasktClient();
  const userAddress = client?.wallet?.address?.toString();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [expandedAssets, setExpandedAssets] = useState<Set<string>>(new Set());

  // Toggle asset expansion
  const toggleAssetExpansion = (assetId: string) => {
    const newExpanded = new Set(expandedAssets);
    if (newExpanded.has(assetId)) {
      newExpanded.delete(assetId);
    } else {
      newExpanded.add(assetId);
    }
    setExpandedAssets(newExpanded);
  };

  // Fetch all user positions
  const { data: positionsData, isLoading: positionsLoading } = trpc.position.getPositions.useQuery(
    { userId: userAddress || '' },
    {
      enabled: !!userAddress,
      refetchInterval: 10 * 1000,
    },
  );

  // Fetch all baskets for position details
  const { data: basketsData, isLoading: basketsLoading } = trpc.baskt.getAllBaskts.useQuery(
    undefined,
    {
      refetchInterval: 30 * 1000,
    },
  );

  // Calculate portfolio summary
  const portfolioSummary = useMemo((): PortfolioSummary => {
    // Check if both queries returned successful responses with data
    const hasPositionsData =
      positionsData?.success && 'data' in positionsData && positionsData.data;
    const hasBasketsData = basketsData?.success && 'data' in basketsData && basketsData.data;

    if (!hasPositionsData || !hasBasketsData) {
      return {
        totalPnL: 0,
        totalPnLPercentage: 0,
        openPositions: 0,
        totalValue: 0,
        totalCollateral: 0,
        assetExposures: [],
      };
    }
    // eslint-disable-next-line
    const positions: PortfolioPosition[] = positionsData.data.map((pos: any) => ({
      positionId: pos.positionId || '',
      positionPDA: pos.positionPDA || '',
      basktId: pos.basktId || '',
      basktName: '', // Will be filled later
      entryPrice: pos.entryPrice || '0',
      exitPrice: pos.exitPrice || '0',
      owner: pos.owner || '',
      status: pos.status || PositionStatus.OPEN,
      size: pos.size || '0',
      collateral: pos.collateral || '0',
      isLong: pos.isLong || false,
      usdcSize: pos.usdcSize || '0',
      timestampOpen: pos.timestampOpen,
    }));

    const baskets = basketsData.data.filter((b) => b !== null) as any[]; //eslint-disable-line

    // Filter open positions
    const openPositions = positions.filter((p) => p.status === PositionStatus.OPEN);

    // Calculate total collateral
    const totalCollateral = openPositions.reduce((sum, pos) => {
      return sum + (pos.collateral ? new BN(pos.collateral).toNumber() : 0);
    }, 0);

    // Group positions by asset and calculate exposures
    const assetExposuresMap = new Map<string, AssetExposure>();

    openPositions.forEach((position) => {
      // eslint-disable-next-line
      const basket = baskets.find((b: any) => b.basktId === position.basktId);
      if (!basket) return;

      // Update position with basket name
      position.basktName = basket.name || 'Unknown Basket';

      // Get all assets in the basket
      const basketAssets = basket.assets || [];
      const currentPrice = basket.price || 0;
      const size =
        position.usdcSize && !isNaN(Number(position.usdcSize))
          ? new BN(position.usdcSize).toNumber()
          : 0;
      const entryPrice = position.entryPrice ? new BN(position.entryPrice).toNumber() : 0;

      const totalPositionPnL = position.isLong
        ? ((currentPrice - entryPrice) * size) / entryPrice
        : ((entryPrice - currentPrice) * size) / entryPrice;

      // If basket has multiple assets, divide PnL among them
      if (basketAssets.length > 0) {
        // Divide position size and PnL equally among assets for now
        const assetCount = basketAssets.length;
        const sizePerAsset = size / assetCount;
        const pnlPerAsset = totalPositionPnL / assetCount;

        // eslint-disable-next-line
        basketAssets.forEach((asset: any) => {
          const assetId = asset.assetAddress || `${position.basktId}-${asset.name}`;
          const assetName = asset.name || 'Unknown Asset';
          const assetTicker = asset.ticker || 'UNKNOWN';

          if (!assetExposuresMap.has(assetId)) {
            assetExposuresMap.set(assetId, {
              assetId,
              assetName,
              assetTicker,
              totalLongExposure: 0,
              totalShortExposure: 0,
              netExposure: 0,
              avgEntryPrice: 0,
              currentPrice,
              pnl: 0,
              pnlPercentage: 0,
              positions: [],
            });
          }

          const exposure = assetExposuresMap.get(assetId)!;

          if (position.isLong) {
            exposure.totalLongExposure += sizePerAsset;
          } else {
            exposure.totalShortExposure += sizePerAsset;
          }

          // Create a position entry for this asset
          const assetPosition = {
            ...position,
            basktName: basket.name || 'Unknown Basket',
            currentPrice,
            pnl: pnlPerAsset,
            pnlPercentage: (pnlPerAsset / sizePerAsset) * 100,
            // Override usdcSize for this asset
            usdcSize: sizePerAsset.toString(),
          };

          exposure.positions.push(assetPosition);
        });
      } else {
        // Fallback: if no assets defined, use basket ID as asset
        const assetId = position.basktId;
        const assetName = basket.name || 'Unknown Asset';
        const assetTicker = 'UNKNOWN';

        if (!assetExposuresMap.has(assetId)) {
          assetExposuresMap.set(assetId, {
            assetId,
            assetName,
            assetTicker,
            totalLongExposure: 0,
            totalShortExposure: 0,
            netExposure: 0,
            avgEntryPrice: 0,
            currentPrice,
            pnl: 0,
            pnlPercentage: 0,
            positions: [],
          });
        }

        const exposure = assetExposuresMap.get(assetId)!;

        if (position.isLong) {
          exposure.totalLongExposure += size;
        } else {
          exposure.totalShortExposure += size;
        }

        exposure.positions.push({
          ...position,
          basktName: basket.name || 'Unknown Basket',
          currentPrice,
          pnl: totalPositionPnL,
          pnlPercentage: (totalPositionPnL / size) * 100,
        });
      }
    });

    // Calculate averages and totals for each asset
    const assetExposures = Array.from(assetExposuresMap.values()).map((exposure) => {
      const totalExposure = exposure.totalLongExposure + exposure.totalShortExposure;
      const netExposure = exposure.totalLongExposure - exposure.totalShortExposure;

      // Calculate weighted average entry price
      const totalEntryValue = exposure.positions.reduce((sum, pos) => {
        const entryPrice = pos.entryPrice ? new BN(pos.entryPrice).toNumber() : 0;
        const size =
          pos.usdcSize && !isNaN(Number(pos.usdcSize)) ? new BN(pos.usdcSize).toNumber() : 0;
        return sum + entryPrice * size;
      }, 0);

      const avgEntryPrice = totalExposure > 0 ? totalEntryValue / totalExposure : 0;

      // Calculate total PnL for this asset
      const totalPnL = exposure.positions.reduce((sum, pos) => sum + (pos.pnl || 0), 0);
      const pnlPercentage = totalExposure > 0 ? (totalPnL / totalExposure) * 100 : 0;

      return {
        ...exposure,
        netExposure,
        avgEntryPrice,
        pnl: totalPnL,
        pnlPercentage,
      };
    });

    // Calculate portfolio totals
    const totalPnL = assetExposures.reduce((sum, asset) => sum + asset.pnl, 0);
    const totalValue = totalCollateral + totalPnL;
    const totalPnLPercentage = totalCollateral > 0 ? (totalPnL / totalCollateral) * 100 : 0;

    return {
      totalPnL,
      totalPnLPercentage,
      openPositions: openPositions.length,
      totalValue,
      totalCollateral,
      assetExposures,
    };
  }, [positionsData, basketsData]);

  if (!userAddress) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Connect Your Wallet</h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Please connect your wallet to view your portfolio.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (positionsLoading || basketsLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold mb-2">Loading Portfolio</h1>
            <p className="text-muted-foreground">Fetching your positions and basket data...</p>
          </div>
        </div>
      </main>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'positions', label: 'All Positions' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Asset Exposure Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium">Asset</th>
                      <th className="text-left py-3 px-4 font-medium">Net Exposure</th>
                      <th className="text-left py-3 px-4 font-medium">Long</th>
                      <th className="text-left py-3 px-4 font-medium">Short</th>
                      <th className="text-left py-3 px-4 font-medium">Avg Entry</th>
                      <th className="text-left py-3 px-4 font-medium">Current Price</th>
                      <th className="text-left py-3 px-4 font-medium">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolioSummary.assetExposures.map((asset) => (
                      <>
                        <tr
                          key={asset.assetId}
                          className="border-b border-border hover:bg-muted/50 cursor-pointer"
                          onClick={() => toggleAssetExpansion(asset.assetId)}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <span
                                className={`text-sm transition-transform ${
                                  expandedAssets.has(asset.assetId) ? 'rotate-90' : ''
                                }`}
                              >
                                &gt;
                              </span>
                              <div>
                                <p className="font-medium">{asset.assetName}</p>
                                <p className="text-sm text-muted-foreground">{asset.assetTicker}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`font-medium ${
                                asset.netExposure >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              <NumberFormat value={Math.abs(asset.netExposure)} isPrice={true} />
                              {asset.netExposure >= 0 ? ' Long' : ' Short'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <NumberFormat value={asset.totalLongExposure} isPrice={true} />
                          </td>
                          <td className="py-3 px-4">
                            <NumberFormat value={asset.totalShortExposure} isPrice={true} />
                          </td>
                          <td className="py-3 px-4">
                            <NumberFormat value={asset.avgEntryPrice} isPrice={true} />
                          </td>
                          <td className="py-3 px-4">
                            <NumberFormat value={asset.currentPrice} isPrice={true} />
                          </td>
                          <td className="py-3 px-4">
                            <div
                              className={`${asset.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}
                            >
                              <NumberFormat value={asset.pnl} isPrice={true} />
                              <span className="text-xs ml-1">
                                ({asset.pnlPercentage.toFixed(2)}%)
                              </span>
                            </div>
                          </td>
                        </tr>
                        {expandedAssets.has(asset.assetId) && (
                          <tr key={`${asset.assetId}-positions`} className="bg-muted/30">
                            <td colSpan={7} className="px-4 py-3">
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm mb-2">
                                  Positions in {asset.assetName}
                                </h4>
                                <div className="overflow-x-auto">
                                  <table className="w-full">
                                    <thead>
                                      <tr className="border-b border-border">
                                        <th className="text-left py-2 px-4 font-medium text-xs">
                                          Basket
                                        </th>
                                        <th className="text-left py-2 px-4 font-medium text-xs">
                                          Direction
                                        </th>
                                        <th className="text-left py-2 px-4 font-medium text-xs">
                                          Size
                                        </th>
                                        <th className="text-left py-2 px-4 font-medium text-xs">
                                          Entry Price
                                        </th>
                                        <th className="text-left py-2 px-4 font-medium text-xs">
                                          Current Price
                                        </th>
                                        <th className="text-left py-2 px-4 font-medium text-xs">
                                          P&L
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {asset.positions.map((position) => (
                                        <tr
                                          key={position.positionPDA}
                                          className="border-b border-border hover:bg-muted/50"
                                        >
                                          <td className="py-2 px-4">
                                            <p className="font-medium text-sm">
                                              {position.basktName}
                                            </p>
                                          </td>
                                          <td className="py-2 px-4">
                                            <span
                                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                position.isLong
                                                  ? 'bg-green-100 text-green-800'
                                                  : 'bg-red-100 text-red-800'
                                              }`}
                                            >
                                              {position.isLong ? 'Long' : 'Short'}
                                            </span>
                                          </td>
                                          <td className="py-2 px-4">
                                            <NumberFormat
                                              value={new BN(position.usdcSize || '0').toNumber()}
                                              isPrice={true}
                                            />
                                          </td>
                                          <td className="py-2 px-4">
                                            <NumberFormat
                                              value={new BN(position.entryPrice || '0').toNumber()}
                                              isPrice={true}
                                            />
                                          </td>
                                          <td className="py-2 px-4">
                                            <NumberFormat
                                              value={position.currentPrice || 0}
                                              isPrice={true}
                                            />
                                          </td>
                                          <td className="py-2 px-4">
                                            <div
                                              className={`${
                                                position.pnl && position.pnl >= 0
                                                  ? 'text-green-600'
                                                  : 'text-red-600'
                                              }`}
                                            >
                                              <NumberFormat
                                                value={position.pnl || 0}
                                                isPrice={true}
                                              />
                                              <span className="text-xs ml-1">
                                                ({position.pnlPercentage?.toFixed(2)}%)
                                              </span>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
                {portfolioSummary.assetExposures.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No open positions found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      case 'positions':
        return (
          <Card>
            <CardHeader>
              <CardTitle>All Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium">Basket</th>
                      <th className="text-left py-3 px-4 font-medium">Direction</th>
                      <th className="text-left py-3 px-4 font-medium">Size</th>
                      <th className="text-left py-3 px-4 font-medium">Entry Price</th>
                      <th className="text-left py-3 px-4 font-medium">Current Price</th>
                      <th className="text-left py-3 px-4 font-medium">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolioSummary.assetExposures.flatMap((asset) =>
                      asset.positions.map((position) => (
                        <tr
                          key={position.positionPDA}
                          className="border-b border-border hover:bg-muted/50"
                        >
                          <td className="py-3 px-4">
                            <p className="font-medium">{position.basktName}</p>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                position.isLong
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {position.isLong ? 'Long' : 'Short'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <NumberFormat
                              value={new BN(position.usdcSize || '0').toNumber()}
                              isPrice={true}
                            />
                          </td>
                          <td className="py-3 px-4">
                            <NumberFormat
                              value={new BN(position.entryPrice || '0').toNumber()}
                              isPrice={true}
                            />
                          </td>
                          <td className="py-3 px-4">
                            <NumberFormat value={position.currentPrice || 0} isPrice={true} />
                          </td>
                          <td className="py-3 px-4">
                            <div
                              className={`${
                                position.pnl && position.pnl >= 0
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}
                            >
                              <NumberFormat value={position.pnl || 0} isPrice={true} />
                              <span className="text-xs ml-1">
                                ({position.pnlPercentage?.toFixed(2)}%)
                              </span>
                            </div>
                          </td>
                        </tr>
                      )),
                    )}
                  </tbody>
                </table>
                {portfolioSummary.assetExposures.flatMap((asset) => asset.positions).length ===
                  0 && (
                  <div className="text-center py-8 text-muted-foreground">No positions found</div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Portfolio</h1>
        <p className="text-muted-foreground">
          Track your positions, P&L, and asset exposure across all baskets
        </p>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            {portfolioSummary.totalPnL >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                portfolioSummary.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              <NumberFormat value={portfolioSummary.totalPnL} isPrice={true} />
            </div>
            <p
              className={`text-xs ${
                portfolioSummary.totalPnLPercentage >= 0 ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {portfolioSummary.totalPnLPercentage >= 0 ? '+' : ''}
              {portfolioSummary.totalPnLPercentage.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolioSummary.openPositions}</div>
            <p className="text-xs text-muted-foreground">Active positions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <NumberFormat value={portfolioSummary.totalValue} isPrice={true} />
            </div>
            <p className="text-xs text-muted-foreground">Portfolio value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collateral</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <NumberFormat value={portfolioSummary.totalCollateral} isPrice={true} />
            </div>
            <p className="text-xs text-muted-foreground">Locked collateral</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-border mb-6">
        <div className="flex items-center space-x-4 sm:space-x-6 px-4 overflow-x-auto whitespace-nowrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-primary'
              }`}
              onClick={() => setActiveTab(tab.id as TabType)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </main>
  );
}
