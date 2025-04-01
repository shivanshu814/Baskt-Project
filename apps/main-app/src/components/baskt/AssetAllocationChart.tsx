import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Asset } from '../../data/baskts-data';
import { cn } from '../../lib/utils';

interface AssetAllocationChartProps {
  assets: Asset[];
  className?: string;
}

interface ChartData {
  name: string;
  value: number;
  position: 'long' | 'short';
  longShort: 'long' | 'short';
}

export function AssetAllocationChart({ assets, className }: AssetAllocationChartProps) {
  // Colors for the pie chart
  const LONG_COLORS = ['#0088FE', '#00C49F', '#00BFB0', '#1977F3', '#4299E1'];
  const SHORT_COLORS = ['#FF8042', '#FF4560', '#FF0000', '#FF6B6B', '#FF7979'];

  const chartData = assets.map((asset) => ({
    name: asset.symbol,
    value: asset.weightage,
    position: asset.position,
    longShort: asset.position,
  }));

  const getColor = (entry: ChartData, index: number) => {
    return entry.position === 'long'
      ? LONG_COLORS[index % LONG_COLORS.length]
      : SHORT_COLORS[index % SHORT_COLORS.length];
  };

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            nameKey="name"
            label={({ name, value }) => `${name} (${value}%)`}
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry, index)} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string, props) => {
              const data = props.payload as unknown as ChartData;
              return [`${value}%`, `${name} (${data.position})`];
            }}
          />
          <Legend
            formatter={(value, entry) => {
              const data = entry.payload as unknown as ChartData;
              return (
                <span className="text-xs">
                  {value}
                  <span
                    className={cn(
                      'ml-1',
                      data.position === 'long' ? 'text-success' : 'text-destructive',
                    )}
                  >
                    ({data.position})
                  </span>
                </span>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="flex justify-between text-sm text-muted-foreground mt-4">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-success mr-1"></div>
          <span>Long positions</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-destructive mr-1"></div>
          <span>Short positions</span>
        </div>
      </div>
    </div>
  );
}
