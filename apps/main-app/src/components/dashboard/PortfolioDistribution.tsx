import React from 'react';

interface PortfolioDistributionProps {
  basktData: { name: string; value: number; percent: number }[];
}

const COLORS = ['#FF9900', '#3366FF', '#00C49F', '#FF444F', '#FFBB28', '#8884d8'];

export const PortfolioDistribution: React.FC<PortfolioDistributionProps> = ({ basktData }) => {
  return (
    <div className="bg-white/5 rounded-2xl p-6 shadow flex flex-col gap-4">
      <h2 className="text-xl font-bold mb-4">Baskt Distribution</h2>
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
              <span className="font-semibold text-base truncate max-w-[180px]" title={baskt.name}>
                {baskt.name.length > 16
                  ? baskt.name.slice(0, 6) + '...' + baskt.name.slice(-4)
                  : baskt.name}
              </span>
            </span>
            <span className="font-mono text-base font-bold text-white ml-4">
              ${baskt.value.toLocaleString(undefined, { maximumFractionDigits: 2 })} (
              {baskt.percent.toFixed(2)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
