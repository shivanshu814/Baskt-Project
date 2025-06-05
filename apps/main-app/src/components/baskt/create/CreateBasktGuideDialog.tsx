import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Dialog } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { PlusCircle, Layers, BarChart, Share2, Shield } from 'lucide-react';
import { CreateBasktGuideDialogProps } from '../../../types/baskt';

export function CreateBasktGuideDialog({ open, onOpenChange }: CreateBasktGuideDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">How to Create a Baskt</DialogTitle>
          <DialogDescription className="text-lg">
            Baskts allow you to create and manage portfolios of assets with custom allocations.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
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

        <h3 className="text-xl font-bold mb-4">Creating Your Baskt in 4 Simple Steps</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <span className="font-bold text-primary">1</span>
              </div>
              <CardTitle className="text-base">Name & Describe</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Give your Baskt a clear name and write a description that explains your investment
              strategy and what market narrative you're targeting.
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <span className="font-bold text-primary">2</span>
              </div>
              <CardTitle className="text-base">Add Tags</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Add relevant categories to your Baskt for better organization and discoverability. Be
              specific about the focus of your Baskt.
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <span className="font-bold text-primary">3</span>
              </div>
              <CardTitle className="text-base">Add Assets</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Add your chosen assets and set their weightings in the Baskt. You can include both
              long and short positions, and weightings must total 100%.
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <span className="font-bold text-primary">4</span>
              </div>
              <CardTitle className="text-base">Launch & Manage</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Once created, you can track your Baskt's performance, make adjustments as needed, and
              share your strategy with others in the community.
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Share2 className="h-5 w-5 text-primary" />
                Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="min-w-5 mt-0.5">•</div>
                  <div>
                    <span className="font-medium">Focus on narratives:</span>
                    <p className="text-xs text-muted-foreground">
                      Build Baskts around emerging market trends.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="min-w-5 mt-0.5">•</div>
                  <div>
                    <span className="font-medium">Diversify wisely:</span>
                    <p className="text-xs text-muted-foreground">
                      Include 4-8 assets for optimal diversification.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="min-w-5 mt-0.5">•</div>
                  <div>
                    <span className="font-medium">Consider correlations:</span>
                    <p className="text-xs text-muted-foreground">
                      Select assets that complement each other.
                    </p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-5 w-5 text-primary" />
                DeFAI Advantage
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <p className="text-muted-foreground text-xs">
                BasktFun leverages advanced DeFAI tools to optimize your index performance:
              </p>
              <div className="space-y-2">
                <div className="border rounded-lg p-2">
                  <h4 className="font-medium text-xs mb-1">AI-Powered Analytics</h4>
                  <p className="text-xs text-muted-foreground">
                    AI analyzes market data and on-chain metrics to identify opportunities.
                  </p>
                </div>
                <div className="border rounded-lg p-2">
                  <h4 className="font-medium text-xs mb-1">Smart Rebalancing</h4>
                  <p className="text-xs text-muted-foreground">
                    Automated rebalancing based on your preferred schedule.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center">
          <Button onClick={() => onOpenChange(false)} className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5" />
            Start Creating Your Baskt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
