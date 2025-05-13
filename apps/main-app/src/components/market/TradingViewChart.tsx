import { cn } from '@baskt/ui';
import { TradingViewChartProps } from '../../types/market';
import { useEffect, useRef, useMemo, useCallback } from 'react';
import {
  createChart,
  ColorType,
  Time,
  IChartApi,
  LineSeries,
} from 'lightweight-charts';
import { trpc } from '../../utils/trpc';

type ChartPeriod = '1D' | '1W' | '1M' | '1Y' | 'All';


// Chart styling options
const CHART_OPTIONS = {
  layout: {
    textColor: '#808A9D',
    background: { type: ColorType.Solid, color: 'transparent' },
  },
  grid: {
    vertLines: { color: '#2B2B3C', style: 1 },
    horzLines: { color: '#2B2B3C', style: 1 },
  },
  rightPriceScale: {
    borderColor: '#2B2B3C',
    textColor: '#808A9D',
  },
  // crosshair: {
  //   vertLine: { color: '#808A9D', width: 1, style: 2 },
  //   horzLine: { color: '#808A9D', width: 1, style: 2 },
  // },
  watermark: { visible: false },
  height: 500,
};


// Line chart styling (blue)
const LINE_SERIES_OPTIONS = {
  color: '#0052FF',
};

const REFRESH_INTERVAL = 30 * 1000; // 30 seconds

export function TradingViewChart({
  className,
  period = '1D',
}: Partial<TradingViewChartProps>) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);


  // TODO: We can get this from initial fetch 
  // Fetch chart data
  const { data: tradingData } = trpc.baskt.getTradingData.useQuery(
    {
      period: period as ChartPeriod,
      //TODO Change to baskt id from props
      basktId: '6pHyAuUWFjHGQNX5wcDZ8nzkeDcmEmBmQh7PDQy5QZyM',
    },
    { refetchInterval: REFRESH_INTERVAL }
  );

  // Format time labels based on selected period
  const formatTime = useCallback((timestamp: number) => {
    const date = new Date(timestamp * 1000);
    if (period === '1D') return date.toDateString();
    if (period === '1W') return `${date.toLocaleDateString()} ${date.getHours()}:00`;
    return date.toLocaleDateString();
  }, [period]);

  // Configure time scale options
  const timeScaleOptions = useMemo(() => ({
    borderColor: '#2B2B3C',
    tickMarkFormatter: (time: Time) => formatTime(Number(time)),
    timeVisible: true,
    secondsVisible: period === '1D',
  }), [formatTime, period]);

  // Initialize chart when component mounts
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clean up any existing chart
    if (chartRef.current) {
      chartRef.current.remove();
    }

    // Create new chart
    const chart = createChart(chartContainerRef.current, {
      ...CHART_OPTIONS,
      width: chartContainerRef.current.clientWidth,
      timeScale: timeScaleOptions,
    });

    const lineSeries = chart.addSeries(LineSeries, LINE_SERIES_OPTIONS);

    // Configure zero-based Y-axis for line charts only
    chart.priceScale('right').applyOptions({
      autoScale: false,
      scaleMargins: { top: 0.1, bottom: 0.1 },
    });

    // Store the series reference for later use
    (chart as any).activeSeries = lineSeries;

    // Store chart reference
    chartRef.current = chart;

    // Make chart fit all data
    chart.timeScale().fitContent();

    // Handle window resize
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.resize(
          chartContainerRef.current.clientWidth,
          CHART_OPTIONS.height
        );
      }
      chartRef.current?.timeScale().fitContent();
    };

    window.addEventListener('resize', handleResize);

    // Clean up on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [timeScaleOptions]);

  // Update chart data when it changes
  useEffect(() => {
    if (!chartRef.current || !tradingData?.data?.length) return;

    // Access the stored series reference
    const series = (chartRef.current as any).activeSeries;
    if (!series) return;
    // Set chart data
    series.setData(tradingData.data);

    chartRef.current?.timeScale().fitContent();

  }, [tradingData?.data]);

  return (
    <div className={cn('w-full h-[500px]', className)}>
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
}
