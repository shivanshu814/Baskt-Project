'use client';

import {
  AreaSeries,
  ColorType,
  createChart,
  CrosshairMode,
  IChartApi,
  Time,
} from 'lightweight-charts';
import { Loader2, LucideInfo, LucideXCircle, Target, TrendingUp } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { trpc } from '../../../../lib/api/trpc';
import {
  ChartPeriod,
  TooltipData,
  TradingDataPoint,
  TradingDataResponse,
} from '../../../../types/baskt';
import { TradingChartProps } from '../../../../types/trading/orders';
import { TradingPanel } from '../layout/TradingPanel';

const NAV_TRACKING_INTERVAL_MINUTES = 5;

const CHART_OPTIONS = {
  layout: {
    textColor: '#FFFFFF',
    background: { type: ColorType.Solid, color: 'transparent' },
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  grid: {
    vertLines: { color: 'hsl(var(--border))', style: 1 },
    horzLines: { color: 'hsl(var(--border))', style: 1 },
  },
  rightPriceScale: {
    borderColor: 'hsl(var(--border))',
    textColor: '#FFFFFF',
    scaleMargins: {
      top: 0.25,
      bottom: 0.25,
    },
    borderVisible: true,
    ticksVisible: true,
    autoScale: true,
  },
  timeScale: {
    borderColor: 'hsl(var(--border))',
    textColor: '#FFFFFF',
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
      color: 'hsl(var(--primary))',
      width: 1,
      style: 2,
      labelBackgroundColor: 'hsl(var(--primary))',
    },
    horzLine: {
      color: 'hsl(var(--primary))',
      width: 1,
      style: 2,
      labelBackgroundColor: 'hsl(var(--primary))',
    },
  },
} as const;

const AREA_SERIES_OPTIONS = {
  topColor: 'rgba(139, 92, 246, 0.8)',
  bottomColor: 'rgba(139, 92, 246, 0.1)',
  lineColor: 'hsl(var(--primary))',
  lineWidth: 1 as const,
  crosshairMarkerVisible: true,
  crosshairMarkerRadius: 6,
  crosshairMarkerBorderColor: 'hsl(var(--background))',
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

export function TradingChart({ baskt }: TradingChartProps) {
  const [mobileTab, setMobileTab] = useState<'markets' | 'trade'>('markets');
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
      basktId: baskt.basktId,
    },
    {
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      enabled: Boolean(baskt.basktId),
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
      borderColor: 'hsl(var(--border))',
      textColor: '#FFFFFF',
      tickMarkFormatter: (time: Time) => formatDate(time),
      timeVisible: true,
      secondsVisible: false,
      rightOffset: 8,
      barSpacing: 4,
      minBarSpacing: 3,
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
      const closest = tradingData?.data?.reduce(
        (closest: TradingDataPoint, current: TradingDataPoint) => {
          const currentDiff = Math.abs(Number(current.time) - crosshairTime);
          const closestDiff = Math.abs(Number(closest.time) - crosshairTime);
          return currentDiff < closestDiff ? current : closest;
        },
      );

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
        rightOffset: 8,
        barSpacing: 4,
        minBarSpacing: 3,
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
      scaleMargins: { top: 0.3, bottom: 0.3 },
      borderVisible: true,
      borderColor: 'hsl(var(--border))',
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
  }, [timeScaleOptions, responsivePeriod, handleCrosshairMove, handleResize]);

  useEffect(() => {
    if (!chartRef.current || !tradingData?.data?.length) return;

    // eslint-disable-next-line
    const series = (chartRef.current as any).activeSeries;
    if (!series) return;

    const smoothedData = tradingData.data.reduce(
      (acc: TradingDataPoint[], point: TradingDataPoint, index: number) => {
        acc.push(point);

        if (index < tradingData.data.length - 1) {
          const nextPoint = tradingData.data[index + 1];
          const timeDiff = nextPoint.time - point.time;
          const valueDiff = nextPoint.value - point.value;

          for (let i = 1; i <= 4; i++) {
            const interpolatedTime = point.time + (timeDiff * i) / 5;
            const interpolatedValue = point.value + (valueDiff * i) / 5;
            acc.push({
              time: interpolatedTime,
              value: interpolatedValue,
            });
          }
        }

        return acc;
      },
      [] as TradingDataPoint[],
    );

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
  }, [tradingData, responsivePeriod]);

  const renderChart = () => {
    if (isLoading && !tradingData?.data?.length) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="animate-spin h-10 w-10 text-primary" />
            <div className="text-lg font-semibold text-primary">Loading Chart</div>
            <div className="text-muted-foreground text-sm">
              Please wait while we fetch the latest trading data for you...
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-full bg-destructive/10 p-3">
              <LucideXCircle className="h-8 w-8 text-destructive" />
            </div>
            <div className="text-lg font-semibold text-destructive">
              Oops! Something went wrong.
            </div>
            <div className="text-muted-foreground text-sm">
              We couldn&apos;t load the chart data. Please try refreshing the page or check your
              connection.
            </div>
          </div>
        </div>
      );
    }

    if (!tradingData || tradingData.data.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-full bg-muted p-3">
              <LucideInfo className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-lg font-semibold text-foreground">No Trading Data</div>
            <div className="text-muted-foreground text-sm">
              There is currently no trading data available for this baskt.
              <br />
              Please check back later or select a different time period.
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full w-full" style={{ position: 'relative' }}>
        {isLoading && tradingData?.data?.length && (
          <div className="absolute top-3 right-3 z-10">
            <div className="bg-primary/10 backdrop-blur-md rounded-full p-2.5 border border-primary/20">
              <Loader2 className="animate-spin h-4 w-4 text-primary" />
            </div>
          </div>
        )}
        <div ref={chartContainerRef} className="h-full w-full" />
        {tooltipData?.show && (
          <div
            className="absolute z-20 px-4 py-3 text-sm bg-background/95 backdrop-blur-xl rounded-2xl shadow-2xl pointer-events-none border border-border/50"
            style={{
              left: tooltipData.x,
              top: tooltipData.y - 40,
              transform: 'translate(-50%, -100%)',
              ...TOOLTIP_STYLES,
            }}
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">
                  {tooltipData.time
                    ? (() => {
                        const date = new Date(tooltipData.time * 1000);
                        const formattedDate = date.toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        });

                        // Debug: Log tooltip time
                        console.log('🕐 Tooltip Time Debug:', {
                          timestamp: tooltipData.time,
                          utcDate: date.toISOString(),
                          formattedDate: formattedDate,
                          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                        });

                        return formattedDate;
                      })()
                    : ''}
                </div>
              </div>
              <div className="text-muted-foreground text-xs font-medium">
                {tooltipData.time
                  ? (() => {
                      const date = new Date(tooltipData.time * 1000);
                      const formattedTime = date.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true,
                      });
                      return formattedTime;
                    })()
                  : ''}
              </div>
              <div className="text-foreground font-bold text-xl">
                ${tooltipData.value != null ? tooltipData.value.toFixed(4) : 'N/A'}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="sm:hidden flex gap-1 mt-1 mx-1 -ml-0.5 mb-1">
        <button
          onClick={() => {
            setMobileTab('markets');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-sm text-sm font-medium transition-colors ${
            mobileTab === 'markets' ? 'bg-primary text-white' : 'bg-zinc-800 text-muted-foreground'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Markets</span>
        </button>
        <button
          onClick={() => {
            setMobileTab('trade');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-sm text-sm font-medium transition-colors ${
            mobileTab === 'trade' ? 'bg-primary text-white' : 'bg-zinc-800 text-muted-foreground'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Trade</span>
        </button>
      </div>

      <div className="py-0">
        {mobileTab === 'markets' && (
          <div className="mt-1 bg-zinc-900/80 border border-border rounded-sm flex flex-col">
            <div className="h-[300px] sm:h-[350px] lg:h-[450px] flex flex-col">{renderChart()}</div>
          </div>
        )}

        {mobileTab === 'trade' && (
          <div className="mt-1 bg-zinc-900/80 border border-border rounded-sm p-4">
            <TradingPanel baskt={baskt} />
          </div>
        )}
      </div>
    </>
  );
}
