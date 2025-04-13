import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/src/tabs';
import { cn } from '@baskt/ui';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TradingViewChartProps } from '../../types/baskt';

export function TradingViewChart({
  className,
  dailyData,
  weeklyData,
  monthlyData,
  yearlyData,
}: TradingViewChartProps) {
  return (
    <div className={cn('overflow-hidden', className)}>
      <Tabs defaultValue="1d" className="w-full">
        <TabsList className="grid grid-cols-4 w-[300px] mb-4">
          <TabsTrigger value="1d">1D</TabsTrigger>
          <TabsTrigger value="1w">1W</TabsTrigger>
          <TabsTrigger value="1m">1M</TabsTrigger>
          <TabsTrigger value="1y">1Y</TabsTrigger>
        </TabsList>

        <TabsContent value="1d" className="m-0 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                mirror
                orientation="right"
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Price']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPrice)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </TabsContent>

        <TabsContent value="1w" className="m-0 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                mirror
                orientation="right"
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Price']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPrice)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </TabsContent>

        <TabsContent value="1m" className="m-0 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                mirror
                orientation="right"
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Price']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPrice)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </TabsContent>

        <TabsContent value="1y" className="m-0 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={yearlyData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                mirror
                orientation="right"
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Price']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPrice)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </TabsContent>
      </Tabs>
    </div>
  );
}
