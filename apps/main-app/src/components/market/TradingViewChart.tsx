import { cn } from '@baskt/ui';
import { TradingViewChartProps } from '../../types/baskt';
import { useEffect, useRef, useMemo, useCallback } from 'react';
import {
  createChart,
  CandlestickSeries,
  BaselineSeries,
  ColorType,
  Time,
  IChartApi,
  ISeriesApi,
  BaselineData as LightweightBaselineData, //eslint-disable-line
} from 'lightweight-charts';
import { trpc } from '../../utils/trpc';

type ChartPeriod = '1D' | '1W' | '1M' | '1Y' | 'All';
type ChartType = 'candle' | 'baseline';

interface CandleData {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface BaselineData {
  time: Time;
  value: number;
}

interface TimeRange {
  from: Time;
  to: Time;
}

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
  crosshair: {
    vertLine: {
      color: '#808A9D',
      width: 1 as const,
      style: 2,
    },
    horzLine: {
      color: '#808A9D',
      width: 1 as const,
      style: 2,
    },
  },
  watermark: {
    visible: false,
  },
  height: 500,
} as const;

const CANDLE_SERIES_OPTIONS = {
  upColor: '#16C784',
  downColor: '#EA3943',
  borderVisible: false,
  wickUpColor: '#16C784',
  wickDownColor: '#EA3943',
} as const;

const BASELINE_SERIES_OPTIONS = {
  baseValue: { type: 'price' as const, price: 150 },
  topLineColor: 'rgba(22, 199, 132, 1)',
  topFillColor1: 'rgba(22, 199, 132, 0.28)',
  topFillColor2: 'rgba(22, 199, 132, 0.05)',
  bottomLineColor: 'rgba(234, 57, 67, 1)',
  bottomFillColor1: 'rgba(234, 57, 67, 0.05)',
  bottomFillColor2: 'rgba(234, 57, 67, 0.28)',
} as const;

const REFRESH_INTERVAL = 30 * 1000; // 30 seconds

export function TradingViewChart({
  className,
  chartType = 'candle',
  period = '1D',
}: Partial<TradingViewChartProps>) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<{
    chart: IChartApi | null;
    series: ISeriesApi<'Candlestick' | 'Baseline'> | null;
  }>({ chart: null, series: null });
  const timeRangeRef = useRef<TimeRange | null>(null);

  const { data: tradingData } = trpc.baskt.getTradingData.useQuery(
    {
      period: period as ChartPeriod,
      chartType: chartType as ChartType,
      basePrice: 150,
    },
    {
      refetchInterval: REFRESH_INTERVAL,
    },
  );

  const formatTime = useCallback(
    (timestamp: number) => {
      const date = new Date(timestamp * 1000);
      if (period === '1D') {
        return date.toLocaleTimeString();
      }
      if (period === '1W') {
        return `${date.toLocaleDateString()} ${date.getHours()}:00`;
      }
      return date.toLocaleDateString();
    },
    [period],
  );

  const timeScaleOptions = useMemo(
    () => ({
      borderColor: '#2B2B3C',
      tickMarkFormatter: (time: Time) => formatTime(Number(time)),
      timeVisible: true,
      secondsVisible: period === '1D',
    }),
    [formatTime, period],
  );

  const handleResize = useCallback(() => {
    if (!chartContainerRef.current || !chartInstanceRef.current.chart) return;

    const newWidth = chartContainerRef.current.clientWidth;
    chartInstanceRef.current.chart.resize(newWidth, CHART_OPTIONS.height);

    if (!timeRangeRef.current) {
      chartInstanceRef.current.chart.timeScale().fitContent();
    }
  }, []);

  const initializeChart = useCallback(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      ...CHART_OPTIONS,
      width: chartContainerRef.current.clientWidth,
      timeScale: timeScaleOptions,
    });

    const series =
      chartType === 'candle'
        ? chart.addSeries(CandlestickSeries, CANDLE_SERIES_OPTIONS)
        : chart.addSeries(BaselineSeries, BASELINE_SERIES_OPTIONS);

    chartInstanceRef.current = { chart, series };

    chart.timeScale().subscribeVisibleTimeRangeChange((range) => {
      if (range) {
        timeRangeRef.current = {
          from: range.from as Time,
          to: range.to as Time,
        };
      }
    });

    return chart;
  }, [chartType, timeScaleOptions]);

  const updateChartData = useCallback(() => {
    if (!chartInstanceRef.current.series || !tradingData?.data) return;

    const data =
      chartType === 'candle'
        ? (tradingData.data as CandleData[])
        : (tradingData.data as BaselineData[]);

    chartInstanceRef.current.series.setData(data);

    if (chartInstanceRef.current.chart && timeRangeRef.current) {
      chartInstanceRef.current.chart.timeScale().setVisibleRange({
        from: timeRangeRef.current.from,
        to: timeRangeRef.current.to,
      });
    }
  }, [tradingData?.data, chartType]);

  useEffect(() => {
    const chart = initializeChart();
    if (!chart) return;

    handleResize();

    const resizeObserver = new ResizeObserver(handleResize);
    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      chart.remove();
      chartInstanceRef.current = { chart: null, series: null };
      timeRangeRef.current = null;
    };
  }, [initializeChart, handleResize]);

  useEffect(() => {
    updateChartData();
  }, [updateChartData]);

  return (
    <div className={cn('w-full overflow-hidden relative', className)}>
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
}
