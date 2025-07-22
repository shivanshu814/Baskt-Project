import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@baskt/ui';
import { Eye, EyeOff, Info, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { NumberFormat } from '@baskt/ui';
import { PortfolioSummary } from '../../types/portfolio';

const PortfolioValueCard = ({ portfolioSummary }: { portfolioSummary: PortfolioSummary }) => {
  const [isValueVisible, setIsValueVisible] = useState(true);
  const toggleValueVisibility = () => setIsValueVisible((v) => !v);
  return (
    <Card className="bg-background border border-border rounded-xl shadow-none bg-white/5">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          Total Portfolio Value
          <button
            onClick={toggleValueVisibility}
            className="p-1 hover:bg-muted rounded-md transition-colors"
            aria-label={isValueVisible ? 'Hide portfolio value' : 'Show portfolio value'}
          >
            {isValueVisible ? (
              <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            ) : (
              <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            )}
          </button>
        </CardTitle>
        <div className="flex items-center gap-2">
          <div className="relative group">
            <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
            <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-popover border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto z-10">
              <p className="text-xs text-muted-foreground">
                This represents the total value of your portfolio including all open positions,
                collateral, and unrealized profit/loss across all baskets.
              </p>
              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-popover"></div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            {isValueVisible ? (
              <NumberFormat
                value={portfolioSummary.totalValue}
                isPrice={true}
                showCurrency={true}
              />
            ) : (
              <span className="text-muted-foreground">*******</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {portfolioSummary.totalPnL >= 0 ? (
                <ArrowUpRight className="text-green-500 h-5 w-5" />
              ) : (
                <ArrowDownRight className="text-red-500 h-5 w-5" />
              )}
              <span
                className={`text-lg font-semibold ${
                  portfolioSummary.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {portfolioSummary.totalPnL >= 0 ? '+' : ''}
                <NumberFormat
                  value={portfolioSummary.totalPnL}
                  isPrice={true}
                  showCurrency={true}
                />
              </span>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                portfolioSummary.totalPnLPercentage >= 0
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
              }`}
            >
              {portfolioSummary.totalPnLPercentage >= 0 ? '+' : ''}
              {portfolioSummary.totalPnLPercentage.toFixed(2)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
export default PortfolioValueCard;
