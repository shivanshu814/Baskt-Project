import { PieChart as LucidePieChart } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@baskt/ui';

interface BasketAllocationPieProps {
  data: { name: string; value: number; color: string }[];
}

export const BasketAllocationPie: React.FC<BasketAllocationPieProps> = ({ data }) => {
  const hasValidData = data && data.length > 0 && data.some((item) => item.value > 0);

  if (!hasValidData) {
    return (
      <div className="bg-white/5 rounded-2xl p-6 shadow flex flex-col items-center justify-center gap-4 min-h-[300px]">
        <h2 className="text-xl font-bold mb-2 self-start">Asset Allocation</h2>
        <div className="flex flex-col items-center justify-center flex-1">
          <div className="text-muted-foreground text-center">
            <LucidePieChart className="w-10 h-10 mb-2 mx-auto" />
            <p className="text-lg font-medium mb-1">No Data Available</p>
            <p className="text-sm text-muted-foreground">
              Asset allocation data will appear here once you have positions or holdings.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);
  // eslint-disable-next-line
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = total > 0 ? ((data.value / total) * 100).toFixed(2) : '0.00';
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-pointer">
                <div className="bg-popover border rounded-lg p-3 shadow-lg">
                  <p className="font-medium text-sm">{data.name}</p>
                  <p className="text-sm text-muted-foreground">
                    ${data.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground">{percentage}%</p>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{data.name}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return null;
  };

  return (
    <div className="bg-white/5 rounded-2xl p-6 shadow flex flex-col items-center gap-4">
      <h2 className="text-xl font-bold mb-2 self-start">Asset Allocation</h2>
      <ResponsiveContainer width={180} height={180}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            label={false}
          >
            {data.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={entry.color} />
            ))}
          </Pie>
          <CustomTooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="w-full flex flex-col gap-2 mt-2">
        {/* eslint-disable-next-line */}
        {data.map((basket, idx) => (
          <div key={basket.name} className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ background: basket.color }}
              ></span>
              <span className="font-medium">{basket.name}</span>
            </span>
            <span className="font-mono text-base font-bold">
              ${basket.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
              <span className="text-xs text-muted-foreground">
                ({total > 0 ? ((basket.value / total) * 100).toFixed(2) : '0.00'}%)
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
