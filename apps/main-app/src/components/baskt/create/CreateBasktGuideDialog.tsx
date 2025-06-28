import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Dialog,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@baskt/ui';
import { PlusCircle, Layers, BarChart, Share2, Shield, X } from 'lucide-react';
import { CreateBasktGuideDialogProps } from '../../../types/baskt';

export function CreateBasktGuideDialog({ open, onOpenChange }: CreateBasktGuideDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] sm:max-h-[90vh] max-w-[95vw] p-0 rounded-2xl overflow-hidden">
        <div className="flex flex-col h-full max-h-[90vh]">
          <DialogHeader className="p-4 sm:p-6 border-b flex-shrink-0">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <DialogTitle className="text-xl sm:text-2xl font-bold">
                  How to Create a Baskt
                </DialogTitle>
                <DialogDescription className="text-sm sm:text-lg mt-2">
                  Baskts allow you to create and manage portfolios of assets with custom
                  allocations.
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 ml-2"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <Layers className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    What is a Baskt?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    A Baskt is a customized index of crypto assets that allows you to:
                  </p>
                  <ul className="list-disc pl-4 sm:pl-5 mt-2 space-y-1 text-xs sm:text-sm text-muted-foreground">
                    <li>Track emerging market narratives</li>
                    <li>Diversify your exposure across multiple assets</li>
                    <li>Create both long and short positions on trends</li>
                    <li>Automate portfolio rebalancing</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <BarChart className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Benefits of Using Baskts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-4 sm:pl-5 space-y-1 text-xs sm:text-sm text-muted-foreground">
                    <li>Reduce risk through diversification</li>
                    <li>Save time by managing multiple assets at once</li>
                    <li>Optimize exposure to specific market sectors</li>
                    <li>Easily track performance against benchmarks</li>
                    <li>Simplified portfolio management</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">
              Creating Your Baskt in 4 Simple Steps
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <span className="font-bold text-primary text-xs sm:text-sm">1</span>
                  </div>
                  <CardTitle className="text-sm sm:text-base">Name & Describe</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Give your Baskt a clear name and write a description that explains your investment
                  strategy and what market narrative you're targeting.
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <span className="font-bold text-primary text-xs sm:text-sm">2</span>
                  </div>
                  <CardTitle className="text-sm sm:text-base">Add Tags</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Add relevant categories to your Baskt for better organization and discoverability.
                  Be specific about the focus of your Baskt.
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <span className="font-bold text-primary text-xs sm:text-sm">3</span>
                  </div>
                  <CardTitle className="text-sm sm:text-base">Add Assets</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Add your chosen assets and set their weightings in the Baskt. You can include both
                  long and short positions, and weightings must total 100%.
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <span className="font-bold text-primary text-xs sm:text-sm">4</span>
                  </div>
                  <CardTitle className="text-sm sm:text-base">Launch & Manage</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Once created, you can track your Baskt's performance, make adjustments as needed,
                  and share your strategy with others in the community.
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <Share2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Best Practices
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-xs sm:text-sm">
                    <li className="flex items-start gap-2">
                      <div className="min-w-4 sm:min-w-5 mt-0.5">•</div>
                      <div>
                        <span className="font-medium">Focus on narratives:</span>
                        <p className="text-xs text-muted-foreground">
                          Build Baskts around emerging market trends.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="min-w-4 sm:min-w-5 mt-0.5">•</div>
                      <div>
                        <span className="font-medium">Diversify wisely:</span>
                        <p className="text-xs text-muted-foreground">
                          Include 4-8 assets for optimal diversification.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="min-w-4 sm:min-w-5 mt-0.5">•</div>
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
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    DeFAI Advantage
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs sm:text-sm space-y-3">
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
          </div>
          <div className="flex justify-center p-4 sm:p-6 border-t flex-shrink-0">
            <Button
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-2 text-sm sm:text-base"
            >
              <PlusCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              Start Creating Your Baskt
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
