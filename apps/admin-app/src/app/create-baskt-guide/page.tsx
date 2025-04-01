'use client';

import { Layout } from '../../components/Layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/src/card';
import { Button } from '../../components/src/button';
import { PlusCircle, Layers, BarChart, Share2, Shield } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { CreateBasktDialog } from '../../components/baskt/CreateBasktDialog';

export default function CreateBasktGuide() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <Layout>
      <div className="container py-6 animate-fade-in">
        <div className="flex flex-col items-center text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">How to Create a Baskt</h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Baskts allow you to create and manage portfolios of assets with custom allocations.
            Follow this guide to create your own Baskt.
          </p>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="mt-6 flex items-center gap-2"
            size="lg"
          >
            <PlusCircle className="h-5 w-5" />
            Create a Baskt Now
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                What is a Baskt?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                A Baskt is a customized index of crypto assets that allows you to:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                <li>Track emerging market narratives</li>
                <li>Diversify your exposure across multiple assets</li>
                <li>Create both long and short positions on trends</li>
                <li>Automate portfolio rebalancing</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5 text-primary" />
                Benefits of Using Baskts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Reduce risk through diversification</li>
                <li>Save time by managing multiple assets at once</li>
                <li>Optimize exposure to specific market sectors</li>
                <li>Easily track performance against benchmarks</li>
                <li>Simplified portfolio management</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-2xl font-bold mb-6 text-center">
          Creating Your Baskt in 4 Simple Steps
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardHeader className="pb-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <span className="font-bold text-primary">1</span>
              </div>
              <CardTitle>Name & Describe</CardTitle>
              <CardDescription>Define your investment thesis</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Give your Baskt a clear name and write a description that explains your investment
                strategy and what market narrative you're targeting.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <span className="font-bold text-primary">2</span>
              </div>
              <CardTitle>Select Category</CardTitle>
              <CardDescription>Choose risk level & sector</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Select a category that best fits your Baskt's focus (DeFi, AI, Meme coins, etc.) and
                set the appropriate risk level to help others understand your strategy.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <span className="font-bold text-primary">3</span>
              </div>
              <CardTitle>Add Assets</CardTitle>
              <CardDescription>Build your allocation</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Add your chosen assets and set their weightings in the Baskt. You can include both
                long and short positions, and weightings must total 100%.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <span className="font-bold text-primary">4</span>
              </div>
              <CardTitle>Launch & Manage</CardTitle>
              <CardDescription>Monitor performance</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Once created, you can track your Baskt's performance, make adjustments as needed,
                and share your strategy with others in the community.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-primary" />
                Best Practices for Baskt Creation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <div className="min-w-5 mt-0.5">•</div>
                  <div>
                    <span className="font-medium">Focus on narratives:</span>
                    <p className="text-sm text-muted-foreground">
                      Build Baskts around emerging market trends or themes for better performance.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="min-w-5 mt-0.5">•</div>
                  <div>
                    <span className="font-medium">Diversify wisely:</span>
                    <p className="text-sm text-muted-foreground">
                      Include 4-8 assets for optimal diversification without diluting performance.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="min-w-5 mt-0.5">•</div>
                  <div>
                    <span className="font-medium">Consider correlations:</span>
                    <p className="text-sm text-muted-foreground">
                      Select assets that complement each other rather than move in exact lockstep.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="min-w-5 mt-0.5">•</div>
                  <div>
                    <span className="font-medium">Use both long and short positions:</span>
                    <p className="text-sm text-muted-foreground">
                      Hedging with strategic shorts can improve overall risk-adjusted returns.
                    </p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                BasktFun's DeFAI Advantage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                BasktFun leverages advanced DeFAI (DeFi + AI) tools to optimize your index
                performance:
              </p>
              <div className="space-y-3">
                <div className="border rounded-lg p-3">
                  <h4 className="font-medium mb-1">AI-Powered Analytics</h4>
                  <p className="text-sm text-muted-foreground">
                    Our AI analyzes market data, social sentiment, and on-chain metrics to identify
                    emerging opportunities.
                  </p>
                </div>
                <div className="border rounded-lg p-3">
                  <h4 className="font-medium mb-1">Smart Rebalancing</h4>
                  <p className="text-sm text-muted-foreground">
                    Automated rebalancing based on market conditions helps maintain optimal
                    exposure.
                  </p>
                </div>
                <div className="border rounded-lg p-3">
                  <h4 className="font-medium mb-1">On-chain Transparency</h4>
                  <p className="text-sm text-muted-foreground">
                    All index operations are executed on-chain, ensuring full transparency and
                    verifiability.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-primary/5 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to create your own Baskt?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            Join thousands of users who are already using Baskts to optimize their crypto strategies
            and stay ahead of market trends.
          </p>
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="flex items-center gap-2"
              size="lg"
            >
              <PlusCircle className="h-5 w-5" />
              Create a Baskt
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/baskts">Browse Existing Baskts</Link>
            </Button>
          </div>
        </div>
      </div>

      <CreateBasktDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
    </Layout>
  );
}
