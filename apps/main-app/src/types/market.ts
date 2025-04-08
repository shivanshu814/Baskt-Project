export interface ChartData {
  date: string;
  price: number;
  volume: number;
}

export interface TradingViewChartProps {
  className?: string;
  dailyData: ChartData[];
  weeklyData: ChartData[];
  monthlyData: ChartData[];
  yearlyData: ChartData[];
}
