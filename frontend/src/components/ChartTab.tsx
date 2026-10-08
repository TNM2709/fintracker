import React, { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts';
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
        background: { color: 'transparent' },
        textColor: '#94a3b8',
        fontSize: 12,
        fontFamily: "'JetBrains Mono', monospace",
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.04)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.04)' },
      },
      crosshair: {
        vertLine: { color: 'rgba(99, 102, 241, 0.4)', width: 1, style: 1 },
        horzLine: { color: 'rgba(99, 102, 241, 0.4)', width: 1, style: 1 },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
        autoScale: true,
      },
    });

    chartInstanceRef.current = chart;

    // Candlestick series with lightweight-charts v5
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#f43f5e',
      borderUpColor: '#10b981',
      borderDownColor: '#f43f5e',
      wickUpColor: '#10b981',
      wickDownColor: '#f43f5e',
    });
    candleSeriesRef.current = candleSeries;

    // Volume Histogram series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#3b82f6',
      priceFormat: { type: 'volume' },
      priceScaleId: '', // overlay
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    volumeSeriesRef.current = volumeSeries;

    // MA20 Line series
    const ma20Series = chart.addSeries(LineSeries, {
      color: '#f59e0b',
      lineWidth: 2,
      title: 'MA20',
      priceScaleId: 'right',
    });
    ma20SeriesRef.current = ma20Series;

    // MA50 Line series
    const ma50Series = chart.addSeries(LineSeries, {
      color: '#06b6d4',
      lineWidth: 2,
      title: 'MA50',
      priceScaleId: 'right',
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

    const handleResize = () => {
      if (container && chart) {
        chart.applyOptions({ width: container.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartInstanceRef.current = null;
    };
  }, []);

  // 2. Fetch & Populate Data when Asset / Timeframe changes
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchCandles(selectedAssetId, timeframe)
      .then((candles) => {
        if (!isMounted || !candleSeriesRef.current || candles.length === 0) return;

        const formattedCandles: CandlestickData<Time>[] = candles.map((c) => ({
          time: c.time as Time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }));

        const formattedVolumes = candles.map((c) => ({
          time: c.time as Time,
          value: c.volume,
          color: c.close >= c.open ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)',
        }));

        candleSeriesRef.current.setData(formattedCandles);
        if (volumeSeriesRef.current) {
          volumeSeriesRef.current.setData(formattedVolumes);
        }

        // MA20
        if (ma20SeriesRef.current) {
          const ma20Data: { time: Time; value: number }[] = [];
          for (let i = 19; i < candles.length; i++) {
            let sum = 0;
            for (let j = i - 19; j <= i; j++) sum += candles[j].close;
            ma20Data.push({ time: candles[i].time as Time, value: sum / 20 });
          }
          ma20SeriesRef.current.setData(showMA20 ? ma20Data : []);
        }

        // MA50
        if (ma50SeriesRef.current) {
          const ma50Data: { time: Time; value: number }[] = [];
          for (let i = 49; i < candles.length; i++) {
            let sum = 0;
            for (let j = i - 49; j <= i; j++) sum += candles[j].close;
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
      <div className="glass-panel" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        {/* Asset Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            padding: '6px 12px',
            borderRadius: 8,
            background: currentAsset?.id.includes('XAU') ? 'rgba(245, 158, 11, 0.15)' : 'rgba(99, 102, 241, 0.15)',
            border: `1px solid ${currentAsset?.id.includes('XAU') ? 'var(--border-gold)' : 'var(--border-glow)'}`,
          }}>
            <span style={{
              fontWeight: 800,
              fontSize: '1rem',
              color: currentAsset?.id.includes('XAU') ? 'var(--accent-gold)' : '#fff',
            }}>
              {currentAsset?.symbol}
            </span>
          </div>

          <select
            value={selectedAssetId}
            onChange={(e) => onSelectAsset(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
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
          <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.04)', borderRadius: 8, padding: 2 }}>
            {['1D', '1W', '1M', 'ALL'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: timeframe === tf ? 'rgba(99, 102, 241, 0.4)' : 'transparent',
                  color: timeframe === tf ? '#fff' : 'var(--text-dim)',
                  transition: 'all 0.15s',
                }}
              >
                {tf}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowMA20(!showMA20)}
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              background: showMA20 ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
              color: showMA20 ? 'var(--accent-gold)' : 'var(--text-dim)',
            }}
          >
            MA 20
          </button>

          <button
            onClick={() => setShowMA50(!showMA50)}
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              background: showMA50 ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
              color: showMA50 ? 'var(--accent-cyan)' : 'var(--text-dim)',
            }}
          >
            MA 50
          </button>
        </div>
      </div>

      {/* Main Chart Canvas Panel */}
      <div className="glass-panel" style={{ padding: '16px 20px', position: 'relative' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
          fontSize: '0.82rem',
          flexWrap: 'wrap',
          gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontWeight: 700, color: '#fff' }}>{currentAsset?.name}</span>
            {hoverData ? (
              <div className="num-mono" style={{ display: 'flex', gap: 12, color: 'var(--text-muted)' }}>
                <span>O: <strong style={{ color: '#fff' }}>{hoverData.open.toLocaleString()}</strong></span>
                <span>H: <strong style={{ color: 'var(--accent-green)' }}>{hoverData.high.toLocaleString()}</strong></span>
                <span>L: <strong style={{ color: 'var(--accent-red)' }}>{hoverData.low.toLocaleString()}</strong></span>
                <span>C: <strong style={{ color: '#fff' }}>{hoverData.close.toLocaleString()}</strong></span>
                <span style={{ color: 'var(--text-dim)' }}>[{hoverData.time}]</span>
              </div>
            ) : (
              <div className="num-mono" style={{ display: 'flex', gap: 10 }}>
                <span style={{ color: 'var(--text-dim)' }}>Giá hiện tại:</span>
                <strong style={{ color: '#fff', fontSize: '0.9rem' }}>
                  {currentAsset?.current_price.toLocaleString()} {currentAsset?.currency}
                </strong>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {showMA20 && <span style={{ color: 'var(--accent-gold)', fontSize: '0.75rem', fontWeight: 600 }}>● MA20</span>}
            {showMA50 && <span style={{ color: 'var(--accent-cyan)', fontSize: '0.75rem', fontWeight: 600 }}>● MA50</span>}
            <span style={{ color: '#3b82f6', fontSize: '0.75rem', fontWeight: 600 }}>■ Volume</span>
          </div>
        </div>

        {isLoading && (
          <div style={{
            position: 'absolute',
            top: 50,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(7, 10, 19, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Đang tải chuỗi nến OHLCV...</span>
          </div>
        )}

        <div ref={chartContainerRef} style={{ width: '100%', minHeight: 480 }} />
      </div>
    </div>
  );
};
