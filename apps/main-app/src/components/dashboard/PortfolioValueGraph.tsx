import { Card, CardHeader, CardTitle, CardContent } from '@baskt/ui';
import { ResponsiveContainer, AreaChart, Area, ReferenceLine } from 'recharts';

interface PortfolioValueData {
  date: string;
  value: number;
}

interface PortfolioValueGraphProps {
  portfolioValueHistory: PortfolioValueData[];
  startValue: number;
}

const PortfolioValueGraph = ({ portfolioValueHistory, startValue }: PortfolioValueGraphProps) => (
  <Card className="bg-background border border-border rounded-xl shadow-none bg-white/5">
    <CardHeader>
      <CardTitle className="flex items-center space-x-2">
        <span className="text-xl font-bold">Portfolio Value Over Time</span>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={portfolioValueHistory}
            margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#2563eb" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <ReferenceLine y={startValue} stroke="#222" strokeDasharray="6 6" strokeWidth={3} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#2563eb"
              strokeWidth={3}
              fill="url(#colorValue)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
);

export default PortfolioValueGraph;
