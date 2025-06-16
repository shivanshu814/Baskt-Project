import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { cn } from '@baskt/ui';
import { TradingViewChartProps } from '../../../types/market';
import { ChartPeriod, TooltipData } from '../../../types/baskt';
import {
  createChart,
  ColorType,
  Time,
  IChartApi,
  AreaSeries,
  CrosshairMode,
} from 'lightweight-charts';
import { trpc } from '../../../utils/trpc';

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
    scaleMargins: {
      top: 0.1,
      bottom: 0.1,
    },
    borderVisible: true,
    ticksVisible: true,
  },
  timeScale: {
    borderColor: '#2B2B3C',
    textColor: '#808A9D',
    borderVisible: true,
    ticksVisible: true,
    timeVisible: true,
    secondsVisible: false,
    fixLeftEdge: true,
    fixRightEdge: true,
    lockVisibleTimeRangeOnResize: true,
  },
  watermark: { visible: false },
  height: 500,
  crosshair: {
    mode: CrosshairMode.Normal,
  },
} as const;


const AREA_SERIES_OPTIONS = {
  topColor: 'rgba(0, 82, 255, 0.56)',
  bottomColor: 'rgba(0, 82, 255, 0.05)',
  lineColor: '#0052FF',
  lineWidth: 1 as const,
  crosshairMarkerVisible: false,
} as const;

const TOOLTIP_STYLES = {
  minWidth: 90,
  maxWidth: 160,
  whiteSpace: 'nowrap' as const,
  boxShadow: '0 2px 8px 0 rgba(0,0,0,0.18)',
  fontFamily: 'Inter, sans-serif',
  letterSpacing: 0.1,
} as const;

export function TradingViewChart({
  className,
  period = '1W',
  basktId,
}: Omit<Partial<TradingViewChartProps>, 'basktId'> & { basktId: string }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);

  const { data: tradingData } = trpc.baskt.getTradingData.useQuery(
    {
      period: period as ChartPeriod,
      basktId,
    },
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      enabled: Boolean(period && basktId),
    },
  );

  const formatDate = useCallback((time: Time, period: ChartPeriod) => {
    const date = new Date(Number(time) * 1000);

    if (period === '1Y') {
      if (date.getDate() === 1) {
        return date.toLocaleDateString([], { month: 'short', year: '2-digit' });
      }
      if (date.getDate() % 7 === 0) {
        return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
      }
      return '';
    }

    if (period === '1M') {
      return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
    }

    if (period === '1W' || period === '1D') {
      return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
    }

    return date.toLocaleDateString();
  }, []);

  const timeScaleOptions = useMemo(
    () => ({
      borderColor: '#2B2B3C',
      tickMarkFormatter: (time: Time) => formatDate(time, period as ChartPeriod),
      timeVisible: true,
      secondsVisible: period === '1D',
      rightOffset: 5,
      barSpacing: 2,
      minBarSpacing: 1,
      fixLeftEdge: true,
      fixRightEdge: true,
      lockVisibleTimeRangeOnResize: true,
    }),
    [period, formatDate],
  );

  const handleCrosshairMove = useCallback(
    // eslint-disable-next-line
    (param: any) => {
      if (!param.point || !tradingData?.data?.length) {
        setTooltipData(null);
        return;
      }

      const crosshairTime = Number(param.time);
      const closest = tradingData.data.reduce((closest, current) => {
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
      chartRef.current.resize(chartContainerRef.current.clientWidth, CHART_OPTIONS.height);
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
      timeScale: {
        ...timeScaleOptions,
        fixLeftEdge: true,
        fixRightEdge: true,
        lockVisibleTimeRangeOnResize: true,
        rightOffset: 12,
        barSpacing: 2,
        minBarSpacing: 1,
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
    });

    // eslint-disable-next-line
    (chart as any).activeSeries = areaSeries;
    chart.priceScale('right').applyOptions({
      autoScale: true,
      scaleMargins: { top: 0.1, bottom: 0.1 },
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

    series.setData(tradingData.data);

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
  }, [tradingData?.data, period]);

  return (
    <div className={cn('w-full h-[500px]', className)} style={{ position: 'relative' }}>
      <div ref={chartContainerRef} className="h-full w-full" />
      {tooltipData?.show && (
        <div
          className="absolute z-20 px-2 py-1 text-xs text-white bg-black/90 rounded-md shadow-lg pointer-events-none border border-white"
          style={{
            left: tooltipData.x,
            top: tooltipData.y - 32,
            transform: 'translate(-50%, -100%)',
            ...TOOLTIP_STYLES,
          }}
        >
          <div style={{ marginBottom: 1 }}>
            {tooltipData.time ? new Date(tooltipData.time * 1000).toLocaleDateString() : ''}
          </div>
          <div style={{ marginBottom: 2 }}>
            {tooltipData.time ? new Date(tooltipData.time * 1000).toLocaleTimeString() : ''}
          </div>
          <div style={{ fontWeight: 600, fontSize: '1em' }}>
            Price: {tooltipData.value != null ? `$${tooltipData.value.toFixed(4)}` : 'N/A'}
          </div>
        </div>
      )}
    </div>
  );
}
