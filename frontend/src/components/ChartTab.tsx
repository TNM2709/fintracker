import React, { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import type { Asset } from '../types';
import { fetchCandles } from '../services/api';

interface ChartTabProps {
  selectedAssetId: string;
  onSelectAsset: (id: string) => void;
  allAssets: Asset[];
}

export const ChartTab: React.FC<ChartTabProps> = ({
  selectedAssetId,
  onSelectAsset,
  allAssets,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const ma20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ma50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  const [timeframe, setTimeframe] = useState<string>('1D');
  const [showMA20, setShowMA20] = useState<boolean>(true);
  const [showMA50, setShowMA50] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hoverData, setHoverData] = useState<{
    open: number;
    high: number;
    low: number;
    close: number;
    time: string;
  } | null>(null);

  const currentAsset = allAssets.find((a) => a.id === selectedAssetId) || allAssets[0];

  // 1. Initialize Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
    }

    const container = chartContainerRef.current;
    const chart = createChart(container, {
      width: container.clientWidth,
      height: 480,
      layout: {
        background: { color: '#18181B' },
        textColor: '#A1A1AA',
        fontSize: 12,
        fontFamily: "'Inter', sans-serif",
      },
      grid: {
        vertLines: { color: 'rgba(63, 63, 70, 0.3)' },
        horzLines: { color: 'rgba(63, 63, 70, 0.3)' },
      },
      crosshair: {
        vertLine: { color: '#00E5FF', width: 1, style: 1 },
        horzLine: { color: '#00E5FF', width: 1, style: 1 },
      },
      timeScale: {
        borderColor: '#3F3F46',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#3F3F46',
        autoScale: true,
      },
    });

    chartInstanceRef.current = chart;

    // Candlestick series with lightweight-charts v5
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10B981',
      downColor: '#EF4444',
      borderUpColor: '#10B981',
      borderDownColor: '#EF4444',
      wickUpColor: '#10B981',
      wickDownColor: '#EF4444',
      priceFormat: {
        type: 'custom',
        formatter: (price: number) => {
          if (price >= 1000000) {
            return (price / 1000000).toFixed(2) + ' tr';
          }
          if (price >= 1000) {
            return price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
          }
          return price.toFixed(2);
        },
      },
    });
    candleSeriesRef.current = candleSeries;

    // Volume Histogram series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#3F3F46',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    volumeSeriesRef.current = volumeSeries;

    // MA20 Line series
    const ma20Series = chart.addSeries(LineSeries, {
      color: '#FAFAFA',
      lineWidth: 2,
      title: 'MA20',
      priceScaleId: 'right',
      priceFormat: {
        type: 'custom',
        formatter: (price: number) => price >= 1000000 ? (price / 1000000).toFixed(2) + ' tr' : price.toLocaleString('en-US'),
      },
    });
    ma20SeriesRef.current = ma20Series;

    // MA50 Line series
    const ma50Series = chart.addSeries(LineSeries, {
      color: '#00E5FF',
      lineWidth: 2,
      title: 'MA50',
      priceScaleId: 'right',
      priceFormat: {
        type: 'custom',
        formatter: (price: number) => price >= 1000000 ? (price / 1000000).toFixed(2) + ' tr' : price.toLocaleString('en-US'),
      },
    });
    ma50SeriesRef.current = ma50Series;

    // Crosshair hover listener
    chart.subscribeCrosshairMove((param) => {
      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > container.clientWidth ||
        param.point.y < 0 ||
        param.point.y > container.clientHeight
      ) {
        setHoverData(null);
      } else {
        const data = param.seriesData.get(candleSeries) as any;
        if (data) {
          setHoverData({
            open: data.open,
            high: data.high,
            low: data.low,
            close: data.close,
            time: new Date((param.time as number) * 1000).toLocaleDateString('vi-VN'),
          });
        }
      }
    });

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || !entries[0].contentRect) return;
      const { width } = entries[0].contentRect;
      chart.applyOptions({ width });
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartInstanceRef.current = null;
    };
  }, []);

  // 2. Fetch and populate candle data
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchCandles(selectedAssetId, timeframe)
      .then((candles) => {
        if (!isMounted) return;

        const sorted = [...candles].sort((a, b) => (a.time as number) - (b.time as number));

        const candleData = sorted.map((c) => ({
          time: c.time as Time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }));
        candleSeriesRef.current?.setData(candleData);

        // Volume data
        const volumeData = sorted.map((c) => ({
          time: c.time as Time,
          value: c.volume || 1000,
          color: c.close >= c.open ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)',
        }));
        volumeSeriesRef.current?.setData(volumeData);

        // Calculate MA20
        if (ma20SeriesRef.current) {
          const ma20Data: { time: Time; value: number }[] = [];
          for (let i = 19; i < candles.length; i++) {
            let sum = 0;
            for (let j = 0; j < 20; j++) {
              sum += candles[i - j].close;
            }
            ma20Data.push({ time: candles[i].time as Time, value: sum / 20 });
          }
          ma20SeriesRef.current.setData(showMA20 ? ma20Data : []);
        }

        // Calculate MA50
        if (ma50SeriesRef.current) {
          const ma50Data: { time: Time; value: number }[] = [];
          for (let i = 49; i < candles.length; i++) {
            let sum = 0;
            for (let j = 0; j < 50; j++) {
              sum += candles[i - j].close;
            }
            ma50Data.push({ time: candles[i].time as Time, value: sum / 50 });
          }
          ma50SeriesRef.current.setData(showMA50 ? ma50Data : []);
        }

        chartInstanceRef.current?.timeScale().fitContent();
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Error loading candles:', err);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedAssetId, timeframe, showMA20, showMA50]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Chart Control Toolbar */}
      <div style={{
        padding: '16px 24px',
        backgroundColor: '#18181B',
        border: '1px solid #27272A',
        borderRadius: 12,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        {/* Asset Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            padding: '6px 12px',
            borderRadius: 8,
            backgroundColor: '#09090B',
            border: '1px solid #3F3F46',
          }}>
            <span style={{
              fontWeight: 600,
              fontSize: '14px',
              color: '#00E5FF',
            }}>
              {currentAsset?.symbol}
            </span>
          </div>

          <select
            value={selectedAssetId}
            onChange={(e) => onSelectAsset(e.target.value)}
            style={{
              backgroundColor: '#09090B',
              border: '1px solid #3F3F46',
              color: '#FAFAFA',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = '2px solid #00E5FF';
              e.currentTarget.style.outlineOffset = '-1px';
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none';
            }}
          >
            <optgroup label="Vàng (Gold)">
              <option value="XAU-SJC">Vàng SJC 999.9 (Lượng)</option>
              <option value="XAU-USD">Vàng Thế Giới (XAU/USD Ounce)</option>
            </optgroup>
            <optgroup label="Chỉ Số & Cổ Phiếu Việt Nam">
              <option value="VN-INDEX">Chỉ Số VN-INDEX</option>
              <option value="VN-VCB">Vietcombank (VCB)</option>
              <option value="VN-FPT">Tập đoàn FPT (FPT)</option>
              <option value="VN-HPG">Hòa Phát (HPG)</option>
              <option value="VN-VHM">Vinhomes (VHM)</option>
            </optgroup>
            <optgroup label="Quốc Tế & Crypto">
              <option value="US-SP500">S&P 500 Index</option>
              <option value="US-AAPL">Apple Inc. (AAPL)</option>
              <option value="US-NVDA">NVIDIA (NVDA)</option>
              <option value="US-TSLA">Tesla (TSLA)</option>
              <option value="CRYPTO-BTC">Bitcoin (BTC)</option>
              <option value="CRYPTO-ETH">Ethereum (ETH)</option>
            </optgroup>
          </select>
        </div>

        {/* Timeframe & Indicators Switchers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', backgroundColor: '#09090B', border: '1px solid #27272A', borderRadius: 8, padding: 2, gap: 2 }}>
            {['1D', '1W', '1M', 'ALL'].map((tf) => {
              const isSelected = timeframe === tf;
              return (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: isSelected ? 600 : 500,
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#27272A' : 'transparent',
                    color: isSelected ? '#FAFAFA' : '#A1A1AA',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tf}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setShowMA20(!showMA20)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              border: '1px solid #3F3F46',
              backgroundColor: showMA20 ? 'rgba(250, 250, 250, 0.12)' : 'transparent',
              color: showMA20 ? '#FAFAFA' : '#71717A',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: showMA20 ? '#FAFAFA' : '#71717A' }} />
            MA 20
          </button>

          <button
            onClick={() => setShowMA50(!showMA50)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              border: '1px solid #3F3F46',
              backgroundColor: showMA50 ? 'rgba(0, 229, 255, 0.12)' : 'transparent',
              color: showMA50 ? '#00E5FF' : '#71717A',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: showMA50 ? '#00E5FF' : '#71717A' }} />
            MA 50
          </button>
        </div>
      </div>

      {/* Main Chart Canvas Panel */}
      <div style={{
        padding: 24,
        backgroundColor: '#18181B',
        border: '1px solid #27272A',
        borderRadius: 12,
        position: 'relative',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          fontSize: '14px',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontWeight: 600, color: '#FAFAFA' }}>{currentAsset?.name}</span>
            {hoverData ? (
              <div style={{ display: 'flex', gap: 12, color: '#A1A1AA', fontFamily: 'monospace', fontSize: '13px' }}>
                <span>O: <strong style={{ color: '#FAFAFA' }}>{hoverData.open.toLocaleString()}</strong></span>
                <span>H: <strong style={{ color: '#10B981' }}>{hoverData.high.toLocaleString()}</strong></span>
                <span>L: <strong style={{ color: '#EF4444' }}>{hoverData.low.toLocaleString()}</strong></span>
                <span>C: <strong style={{ color: '#FAFAFA' }}>{hoverData.close.toLocaleString()}</strong></span>
                <span style={{ color: '#71717A' }}>[{hoverData.time}]</span>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, fontFamily: 'monospace', fontSize: '13px' }}>
                <span style={{ color: '#A1A1AA' }}>Giá hiện tại:</span>
                <strong style={{ color: '#00E5FF', fontSize: '14px' }}>
                  {currentAsset?.current_price.toLocaleString()} {currentAsset?.currency}
                </strong>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {showMA20 && <span style={{ color: '#FAFAFA', fontSize: '12px', fontWeight: 500 }}>● MA20</span>}
            {showMA50 && <span style={{ color: '#00E5FF', fontSize: '12px', fontWeight: 500 }}>● MA50</span>}
            <span style={{ color: '#71717A', fontSize: '12px', fontWeight: 500 }}>■ Volume</span>
          </div>
        </div>

        {isLoading && (
          <div style={{
            position: 'absolute',
            top: 60,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(9, 9, 11, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            borderRadius: 12,
          }}>
            <span style={{ color: '#A1A1AA', fontSize: '14px' }}>Đang tải chuỗi nến OHLCV...</span>
          </div>
        )}

        <div ref={chartContainerRef} style={{ width: '100%', minHeight: 480 }} />
      </div>
    </div>
  );
};
