import React from 'react';
import { BarChart2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Button, NumberFormat } from '@baskt/ui';

interface PortfolioDistributionProps {
  basktData: { name: string; value: number; percent: number; id?: string }[];
}

const COLORS = ['#FF9900', '#3366FF', '#00C49F', '#FF444F', '#FFBB28', '#8884d8'];

export const PortfolioDistribution: React.FC<PortfolioDistributionProps> = ({ basktData }) => {
  const hasValidData =
    basktData && basktData.length > 0 && basktData.some((item) => item.value > 0);

  if (!hasValidData) {
    return (
      <div className="bg-white/5 rounded-2xl p-6 shadow flex flex-col items-center justify-center gap-4 min-h-[300px]">
        <h2 className="text-xl font-bold mb-2 self-start">Distribution</h2>
        <div className="flex flex-col items-center justify-center flex-1">
          <div className="text-muted-foreground text-center">
            <BarChart2 className="w-10 h-10 mb-2 mx-auto" />
            <p className="text-lg font-medium mb-1">No Data Available</p>
            <p className="text-sm text-muted-foreground">
              Portfolio distribution will appear here once you have positions or holdings.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-2xl p-6 shadow flex flex-col gap-4">
      <h2 className="text-xl font-bold mb-4">Distribution</h2>
      <div className="relative w-full h-5 bg-gray-800 rounded-full overflow-hidden flex">
        {basktData.map((baskt, idx) => (
          <div
            key={baskt.name}
            className="h-5"
            style={{
              width: `${baskt.percent}%`,
              background: COLORS[idx % COLORS.length],
            }}
            title={`${baskt.name}: ${baskt.percent.toFixed(2)}%`}
          />
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {basktData.map((baskt, idx) => (
          <div key={baskt.name} className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ background: COLORS[idx % COLORS.length] }}
              ></span>
              <span
                className="font-semibold text-base truncate max-w-[180px] flex items-center gap-2 group"
                title={baskt.name}
              >
                <span className="hover:underline">
                  {baskt.name.length > 16
                    ? baskt.name.slice(0, 6) + '...' + baskt.name.slice(-4)
                    : baskt.name}
                </span>
                {baskt.name && (
                  <Link href={`/baskts/${encodeURIComponent(baskt.name)}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-primary hover:bg-primary/10 bg-primary/5"
                    >
                      View
                      <ExternalLink className="h-3 w-3 mr-1" />
                    </Button>
                  </Link>
                )}
              </span>
            </span>
            <span className="font-mono text-base font-bold text-white ml-4">
              <NumberFormat value={baskt.value} isPrice={true} showCurrency={true} /> (
              {baskt.percent.toFixed(2)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
