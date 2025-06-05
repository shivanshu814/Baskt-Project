import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader } from '../../ui/card';
import { LineChart } from 'lucide-react';
import { TradingViewChart } from './TradingViewChart';
import { BasktChartProps } from '../../../types/baskt';

export const BasktChart = ({
  baskt,
  chartPeriod,
  setChartPeriod,
  chartType,
  setChartType,
  onCompositionClick,
  onPositionClick,
}: BasktChartProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between border-b">
          <div className="flex items-center space-x-8">
            <button className="px-1 py-2 text-[14px] text-primary border-b-2 border-primary">
              Chart
            </button>
            <button
              className="px-1 py-2 text-[14px] text-muted-foreground hover:text-primary"
              onClick={onCompositionClick}
            >
              Composition
            </button>
            <button
              className="px-1 py-2 text-[14px] text-muted-foreground hover:text-primary"
              onClick={onPositionClick}
            >
              Position
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-md px-3 py-1 text-xs ${
                chartType === 'line'
                  ? 'bg-background text-primary'
                  : 'text-muted-foreground hover:text-primary'
              }`}
              onClick={() => setChartType('line')}
            >
              <LineChart className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
            {['1D', '1W', '1M', '1Y', 'All'].map((period) => (
              <Button
                key={period}
                variant="ghost"
                size="sm"
                className={`rounded-md px-3 py-1 text-xs ${
                  chartPeriod === period
                    ? 'bg-background text-primary'
                    : 'text-muted-foreground hover:text-primary'
                }`}
                onClick={() => setChartPeriod(period)}
              >
                {period}
              </Button>
            ))}
          </div>
        </div>

        <TradingViewChart
          className="h-[500px]"
          dailyData={baskt.priceHistory?.daily || []}
          weeklyData={baskt.priceHistory?.weekly || []}
          monthlyData={baskt.priceHistory?.monthly || []}
          yearlyData={baskt.priceHistory?.yearly || []}
          chartType={chartType}
          period={chartPeriod}
          basktId={baskt.basktId?.toString() || ''}
        />
      </CardContent>
    </Card>
  );
};
