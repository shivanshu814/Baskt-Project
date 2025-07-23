import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { cn } from '@baskt/ui';
import { TradingViewChartProps } from '../../../../types/market';
import { ChartPeriod, TooltipData, TradingDataResponse } from '../../../../types/baskt';
import {
  createChart,
  ColorType,
  Time,
  IChartApi,
  AreaSeries,
  CrosshairMode,
} from 'lightweight-charts';
import { trpc } from '../../../../utils/common/trpc';
import { Loader2, LucideInfo, LucideXCircle } from 'lucide-react';

const CHART_OPTIONS = {
  layout: {
    textColor: '#94A3B8',
    background: { type: ColorType.Solid, color: 'transparent' },
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  grid: {
    vertLines: { color: '#1E293B', style: 1 },
    horzLines: { color: '#1E293B', style: 1 },
  },
  rightPriceScale: {
    borderColor: '#334155',
    textColor: '#94A3B8',
    scaleMargins: {
      top: 0.15,
      bottom: 0.15,
    },
    borderVisible: true,
    ticksVisible: true,
    autoScale: true,
  },
  timeScale: {
    borderColor: '#334155',
    textColor: '#94A3B8',
    borderVisible: true,
    ticksVisible: true,
    timeVisible: true,
    secondsVisible: false,
    fixLeftEdge: true,
    fixRightEdge: true,
    lockVisibleTimeRangeOnResize: true,
  },
  watermark: { visible: false },
  crosshair: {
    mode: CrosshairMode.Normal,
    vertLine: {
      color: '#3B82F6',
      width: 1,
      style: 2,
      labelBackgroundColor: '#1E40AF',
    },
    horzLine: {
      color: '#3B82F6',
      width: 1,
      style: 2,
      labelBackgroundColor: '#1E40AF',
    },
  },
} as const;

const AREA_SERIES_OPTIONS = {
  topColor: 'rgba(59, 130, 246, 0.4)',
  bottomColor: 'rgba(59, 130, 246, 0.02)',
  lineColor: '#3B82F6',
  lineWidth: 2 as const,
  crosshairMarkerVisible: true,
  crosshairMarkerRadius: 4,
  crosshairMarkerBorderColor: '#FFFFFF',
  crosshairMarkerBorderWidth: 2,
  lineType: 2,
} as const;

const TOOLTIP_STYLES = {
  minWidth: 120,
  maxWidth: 180,
  whiteSpace: 'nowrap' as const,
  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
  fontFamily: 'Inter, system-ui, sans-serif',
  letterSpacing: 0.025,
  backdropFilter: 'blur(12px)',
} as const;

export function TradingViewChart({
  className,
  period = '1Y',
  basktId,
}: Omit<Partial<TradingViewChartProps>, 'basktId'> & { basktId: string }) {
  const [responsivePeriod, setResponsivePeriod] = useState<ChartPeriod>('1Y');

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setResponsivePeriod('1M');
      } else {
        setResponsivePeriod('1Y');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);

  const {
    data: tradingData,
    isLoading,
    error,
  } = trpc.baskt.getTradingData.useQuery(
    {
      basktId,
    },
    {
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      enabled: Boolean(basktId),
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      keepPreviousData: true,
    },
  ) as { data: TradingDataResponse | undefined; isLoading: boolean; error: any };

  const formatDate = useCallback((time: Time) => {
    const date = new Date(Number(time) * 1000);
    return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
  }, []);

  const timeScaleOptions = useMemo(
    () => ({
      borderColor: '#334155',
      tickMarkFormatter: (time: Time) => formatDate(time),
      timeVisible: true,
      secondsVisible: false,
      rightOffset: 8,
      barSpacing: 3,
      minBarSpacing: 2,
      fixLeftEdge: true,
      fixRightEdge: true,
      lockVisibleTimeRangeOnResize: true,
    }),
    [formatDate],
  );

  const handleCrosshairMove = useCallback(
    // eslint-disable-next-line
    (param: any) => {
      if (!param.point || !tradingData?.data?.length) {
        setTooltipData(null);
        return;
      }

      const crosshairTime = Number(param.time);
      const closest = tradingData?.data?.reduce((closest, current) => {
        const currentDiff = Math.abs(Number(current.time) - crosshairTime);
        const closestDiff = Math.abs(Number(closest.time) - crosshairTime);
        return currentDiff < closestDiff ? current : closest;
      });

      const containerRect = chartContainerRef.current?.getBoundingClientRect();
      const parentRect = chartContainerRef.current?.offsetParent?.getBoundingClientRect();

      let offsetX = param.point.x;
      let offsetY = param.point.y;

      if (containerRect && parentRect) {
        offsetX = containerRect.left - parentRect.left + param.point.x;
        offsetY = containerRect.top - parentRect.top + param.point.y;
      }

      setTooltipData({
        x: offsetX,
        y: offsetY,
        value: closest.value,
        time: param.time,
        show: true,
      });
    },
    [tradingData?.data],
  );

  const handleResize = useCallback(() => {
    if (chartRef.current && chartContainerRef.current) {
      chartRef.current.resize(
        chartContainerRef.current.clientWidth,
        chartContainerRef.current.clientHeight,
      );
    }
  }, []);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    if (chartRef.current) {
      chartRef.current.remove();
    }

    const chart = createChart(chartContainerRef.current, {
      ...CHART_OPTIONS,
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      timeScale: {
        ...timeScaleOptions,
        fixLeftEdge: true,
        fixRightEdge: true,
        lockVisibleTimeRangeOnResize: true,
        rightOffset: 12,
        barSpacing: 3,
        minBarSpacing: 2,
      },
      handleScroll: {
        vertTouchDrag: false,
        horzTouchDrag: false,
        mouseWheel: false,
        pressedMouseMove: false,
      },
      handleScale: {
        axisPressedMouseMove: false,
        mouseWheel: false,
        pinch: false,
      },
    });

    const areaSeries = chart.addSeries(AreaSeries, {
      ...AREA_SERIES_OPTIONS,
      priceFormat: {
        type: 'price',
        precision: 4,
        minMove: 0.0001,
      },
      lineType: 2,
      lastValueVisible: false,
      priceLineVisible: false,
    });

    // eslint-disable-next-line
    (chart as any).activeSeries = areaSeries;
    chart.priceScale('right').applyOptions({
      autoScale: true,
      scaleMargins: { top: 0.15, bottom: 0.15 },
      borderVisible: true,
      borderColor: '#334155',
    });

    chartRef.current = chart;
    chart.subscribeCrosshairMove(handleCrosshairMove);

    const handleMouseLeave = () => setTooltipData(null);
    const chartDiv = chartContainerRef.current;
    chartDiv?.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      chartDiv?.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, [timeScaleOptions, period, handleCrosshairMove, handleResize]);

  useEffect(() => {
    if (!chartRef.current || !tradingData?.data?.length) return;

    // eslint-disable-next-line
    const series = (chartRef.current as any).activeSeries;
    if (!series) return;

    const smoothedData = tradingData.data.reduce((acc, point, index) => {
      acc.push(point);

      if (index < tradingData.data.length - 1) {
        const nextPoint = tradingData.data[index + 1];
        const timeDiff = nextPoint.time - point.time;
        const valueDiff = nextPoint.value - point.value;

        for (let i = 1; i <= 2; i++) {
          const interpolatedTime = point.time + (timeDiff * i) / 3;
          const interpolatedValue = point.value + (valueDiff * i) / 3;
          acc.push({
            time: interpolatedTime,
            value: interpolatedValue,
          });
        }
      }

      return acc;
    }, [] as typeof tradingData.data);

    series.setData(smoothedData);

    const timeScale = chartRef.current.timeScale();
    const [firstPoint, lastPoint] = [
      tradingData.data[0],
      tradingData.data[tradingData.data.length - 1],
    ];

    if (firstPoint && lastPoint) {
      timeScale.setVisibleRange({
        from: firstPoint.time as Time,
        to: lastPoint.time as Time,
      });
    }
  }, [tradingData?.data, responsivePeriod]);

  if (isLoading && !tradingData?.data?.length) {
    return (
      <div
        className={cn('w-full h-[300px] md:h-[500px] flex items-center justify-center', className)}
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin h-10 w-10 text-blue-500" />
          <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
            Loading Chart
          </div>
          <div className="text-gray-500 dark:text-gray-400 text-sm">
            Please wait while we fetch the latest trading data for you...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn('w-full h-[300px] md:h-[500px] flex items-center justify-center', className)}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-full bg-red-100 p-3">
            <LucideXCircle className="h-8 w-8 text-red-500" />
          </div>
          <div className="text-lg font-semibold text-red-600 dark:text-red-400">
            Oops! Something went wrong.
          </div>
          <div className="text-gray-500 dark:text-gray-400 text-sm">
            We couldn&apos;t load the chart data. Please try refreshing the page or check your
            connection.
          </div>
        </div>
      </div>
    );
  }

  if (!tradingData?.data || tradingData.data.length === 0) {
    return (
      <div
        className={cn('w-full h-[300px] md:h-[500px] flex items-center justify-center', className)}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-3">
            <LucideInfo className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="text-lg font-semibold text-gray-600 dark:text-gray-300">
            No Trading Data
          </div>
          <div className="text-gray-500 dark:text-gray-400 text-sm">
            There is currently no trading data available for this baskt.
            <br />
            Please check back later or select a different time period.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn('w-full h-[300px] md:h-[500px]', className)}
      style={{ position: 'relative' }}
    >
      {isLoading && tradingData?.data?.length && (
        <div className="absolute top-3 right-3 z-10">
          <div className="bg-blue-500/10 backdrop-blur-md rounded-full p-2.5 border border-blue-500/20">
            <Loader2 className="animate-spin h-4 w-4 text-blue-400" />
          </div>
        </div>
      )}
      <div ref={chartContainerRef} className="h-full w-full" />
      {tooltipData?.show && (
        <div
          className="absolute z-20 px-4 py-3 text-sm bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl pointer-events-none border border-white/20 dark:border-slate-700/50"
          style={{
            left: tooltipData.x,
            top: tooltipData.y - 40,
            transform: 'translate(-50%, -100%)',
            ...TOOLTIP_STYLES,
          }}
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">
                {tooltipData.time
                  ? new Date(tooltipData.time * 1000).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : ''}
              </div>
            </div>
            <div className="text-slate-500 dark:text-slate-400 text-xs font-medium">
              {tooltipData.time
                ? new Date(tooltipData.time * 1000).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true,
                  })
                : ''}
            </div>
            <div className="text-slate-900 dark:text-white font-bold text-xl">
              ${tooltipData.value != null ? tooltipData.value.toFixed(4) : 'N/A'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
