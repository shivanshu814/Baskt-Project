'use client';

import { Layout } from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/src/card';
import { ChartBarIcon, PieChart, TrendingUp } from 'lucide-react';

export default function Metrics() {
  // Mock metrics data
  const volumeMetrics = {
    totalVolume: '$1.2M',
    volumeChange: '+15.8%',
    totalPositions: 1254,
    positionsChange: '+8.3%',
    totalUsers: 428,
    usersChange: '+12.5%',
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col items-center justify-center gap-4 mb-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-center">
            Metrics & Analytics
          </h1>
          <p className="text-muted-foreground text-center max-w-2xl">
            Comprehensive metrics and analytics about Baskt trading activities and platform
            performance.
          </p>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <ChartBarIcon className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Trading Metrics</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Volume Metrics */}
          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-md font-medium flex items-center gap-2">
                Volume & Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Total Volume</p>
                  <p className="text-xl font-semibold">{volumeMetrics.totalVolume}</p>
                  <p className="text-xs text-success">{volumeMetrics.volumeChange}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Positions</p>
                  <p className="text-xl font-semibold">{volumeMetrics.totalPositions}</p>
                  <p className="text-xs text-success">{volumeMetrics.positionsChange}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                  <p className="text-xl font-semibold">{volumeMetrics.totalUsers}</p>
                  <p className="text-xs text-success">{volumeMetrics.usersChange}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trading Summary */}
          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-md font-medium flex items-center gap-2">
                Trading Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Longs</span>
                  <span className="font-medium">58%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Shorts</span>
                  <span className="font-medium">42%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Average Position</span>
                  <span className="font-medium">$3,245</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Avg. Collateral Ratio</span>
                  <span className="font-medium">1.8x</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-md font-medium flex items-center gap-2">
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Best Performing Baskt</span>
                  <span className="font-medium">aiBASKT (+24.5%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Worst Performing Baskt</span>
                  <span className="font-medium">memeBASKT (-8.7%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Highest Volume Baskt</span>
                  <span className="font-medium">aiBASKT ($450K)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Avg. Daily Volume</span>
                  <span className="font-medium">$180K</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-2 mb-4 mt-8">
          <PieChart className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Asset Distribution</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category Distribution */}
          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-md font-medium flex items-center gap-2">
                Category Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-primary rounded-full"></div>
                  <span className="text-sm">AI (45%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-success rounded-full"></div>
                  <span className="text-sm">DeFi (22%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-destructive rounded-full"></div>
                  <span className="text-sm">Memecoins (18%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-secondary rounded-full"></div>
                  <span className="text-sm">Astro (15%)</span>
                </div>
              </div>
              <div className="mt-4 h-28 w-full flex">
                <div className="h-full bg-primary" style={{ width: '45%' }}></div>
                <div className="h-full bg-success" style={{ width: '22%' }}></div>
                <div className="h-full bg-destructive" style={{ width: '18%' }}></div>
                <div className="h-full bg-secondary" style={{ width: '15%' }}></div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Distribution */}
          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-md font-medium flex items-center gap-2">
                Risk Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-success rounded-full"></div>
                  <span className="text-sm">Low Risk (35%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-primary rounded-full"></div>
                  <span className="text-sm">Medium Risk (40%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-destructive rounded-full"></div>
                  <span className="text-sm">High Risk (25%)</span>
                </div>
              </div>
              <div className="mt-4 h-28 w-full flex">
                <div className="h-full bg-success" style={{ width: '35%' }}></div>
                <div className="h-full bg-primary" style={{ width: '40%' }}></div>
                <div className="h-full bg-destructive" style={{ width: '25%' }}></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-2 mb-4 mt-8">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Growth Metrics</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User Growth */}
          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-md font-medium">User Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Daily New Users</span>
                  <span className="font-medium">
                    24 <span className="text-xs text-success">+12%</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Weekly New Users</span>
                  <span className="font-medium">
                    145 <span className="text-xs text-success">+8%</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Monthly New Users</span>
                  <span className="font-medium">
                    587 <span className="text-xs text-success">+15%</span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Volume Growth */}
          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-md font-medium">Volume Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Daily Volume</span>
                  <span className="font-medium">
                    $145K <span className="text-xs text-success">+5%</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Weekly Volume</span>
                  <span className="font-medium">
                    $980K <span className="text-xs text-success">+12%</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Monthly Volume</span>
                  <span className="font-medium">
                    $4.2M <span className="text-xs text-success">+18%</span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Position Growth */}
          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-md font-medium">Position Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Daily New Positions</span>
                  <span className="font-medium">
                    87 <span className="text-xs text-success">+7%</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Weekly New Positions</span>
                  <span className="font-medium">
                    452 <span className="text-xs text-success">+9%</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Monthly New Positions</span>
                  <span className="font-medium">
                    1,845 <span className="text-xs text-success">+14%</span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
