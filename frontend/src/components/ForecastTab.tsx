import React, { useEffect, useState } from 'react';
import type { ForecastResult, Asset } from '../types';
import { fetchForecast } from '../services/api';
import { useLanguage } from '../context/useLanguage';
import { TrendingUp, Target, ShieldAlert, Cpu, Compass, Layers } from 'lucide-react';

interface ForecastTabProps {
  selectedAssetId: string;
  onSelectAsset: (id: string) => void;
  allAssets: Asset[];
}

export const ForecastTab: React.FC<ForecastTabProps> = ({
  selectedAssetId,
  onSelectAsset,
  allAssets,
}) => {
  const { t } = useLanguage();
  const [horizon, setHorizon] = useState<number>(30);
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const currentAsset = allAssets.find((a) => a.id === selectedAssetId) || allAssets[0];

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) setLoading(true);
    });

    fetchForecast(selectedAssetId, horizon)
      .then((data) => {
        if (active) {
          setForecast(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Forecast error:', err);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedAssetId, horizon]);

  const getSignalBadge = (sig: string) => {
    switch (sig) {
      case 'STRONG_BUY':
        return (
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '3px 10px',
            borderRadius: 6,
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#10B981',
          }}>
            {t.forecast.strongBuy}
          </span>
        );
      case 'BUY':
        return (
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '3px 10px',
            borderRadius: 6,
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#10B981',
          }}>
            {t.forecast.buy}
          </span>
        );
      case 'SELL':
        return (
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '3px 10px',
            borderRadius: 6,
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#EF4444',
          }}>
            {t.forecast.sell}
          </span>
        );
      default:
        return (
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '3px 10px',
            borderRadius: 6,
            backgroundColor: 'rgba(0, 229, 255, 0.15)',
            border: '1px solid rgba(0, 229, 255, 0.35)',
            color: 'var(--brand-primary)',
          }}>
            {t.forecast.neutral}
          </span>
        );
    }
  };

  const isUSD = currentAsset?.currency === 'USD';
  const formatPrice = (p: number) => {
    if (!p) return '—';
    if (isUSD) return `$${p.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}`;
    return `${p.toLocaleString('vi-VN')} VND`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Selector & Horizon Bar */}
      <div style={{
        padding: '16px 24px',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-card)',
        borderRadius: 12,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 8,
            backgroundColor: 'var(--bg-surface-hover)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px rgba(0, 229, 255, 0.15)',
          }}>
            <Cpu size={20} color="var(--brand-primary)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                {t.forecast.engineTitle}
              </h2>
              <span style={{
                fontSize: '10px',
                fontWeight: 600,
                color: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                padding: '1px 6px',
                borderRadius: 4,
              }}>
                5,000 Iterations
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '3px 0 0 0' }}>
              {t.forecast.engineSubtitle}
            </p>
          </div>
        </div>

        {/* Horizon Switcher & Asset Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <select
            value={selectedAssetId}
            onChange={(e) => onSelectAsset(e.target.value)}
            style={{
              backgroundColor: 'var(--bg-body)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="XAU-SJC">{t.market.sjcGold}</option>
            <option value="XAU-USD">{t.market.worldGold}</option>
            <option value="VN-INDEX">VN-Index</option>
            <option value="VN-FPT">FPT Corp</option>
            <option value="VN-VCB">Vietcombank</option>
            <option value="VN-HPG">Hoa Phat Group</option>
            <option value="US-NVDA">NVIDIA (NVDA)</option>
            <option value="US-AAPL">Apple (AAPL)</option>
            <option value="CRYPTO-BTC">Bitcoin (BTC)</option>
          </select>

          {/* Segmented Control for Horizon */}
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--bg-body)',
            border: '1px solid var(--border-card)',
            borderRadius: 8,
            padding: 2,
            gap: 2,
          }}>
            {[7, 14, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => setHorizon(days)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: horizon === days ? 600 : 500,
                  cursor: 'pointer',
                  backgroundColor: horizon === days ? 'var(--bg-surface-hover)' : 'transparent',
                  color: horizon === days ? 'var(--text-primary)' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                }}
              >
                {t.forecast.daysLabel.replace('{days}', String(days))}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{
          padding: 60,
          textAlign: 'center',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-card)',
          borderRadius: 12,
        }}>
          <div className="pulse-dot" style={{ backgroundColor: 'var(--brand-primary)', margin: '0 auto 16px auto', display: 'block' }} />
          <p style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: 500 }}>
            {t.forecast.loadingForecast}
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: 4 }}>
            {t.forecast.disclaimer}
          </p>
        </div>
      ) : forecast ? (
        <>
          {/* 1. Quantitative Parameters HUD Ribbon */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            marginBottom: 16,
          }}>
            <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-card)', borderRadius: 8, padding: '12px 16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>{t.forecast.volatilityLabel}</div>
              <div className="num-mono" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
                {forecast.annual_volatility.toFixed(1)}% / yr
              </div>
            </div>
            <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-card)', borderRadius: 8, padding: '12px 16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>{t.forecast.expectedDriftLabel}</div>
              <div className="num-mono" style={{ fontSize: '18px', fontWeight: 700, color: forecast.expected_drift >= 0 ? '#10B981' : '#EF4444', marginTop: 4 }}>
                {forecast.expected_drift >= 0 ? '+' : ''}{forecast.expected_drift.toFixed(1)}% / yr
              </div>
            </div>
            <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-card)', borderRadius: 8, padding: '12px 16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>VALUE AT RISK (VaR 95%)</div>
              <div className="num-mono" style={{ fontSize: '18px', fontWeight: 700, color: '#EF4444', marginTop: 4 }}>
                {(((forecast.confidence_low_95 - forecast.current_price) / forecast.current_price) * 100).toFixed(1)}%
              </div>
            </div>
            <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-card)', borderRadius: 8, padding: '12px 16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>{t.forecast.confidenceInterval95}</div>
              <div className="num-mono" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--brand-primary)', marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                [{formatPrice(forecast.confidence_low_95)} - {formatPrice(forecast.confidence_high_95)}]
              </div>
            </div>
          </div>

          {/* 2. Kich ban 3 Cot (Bear, Base, Bull) with glowing accent headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
          }}>
            {/* Bearish Target */}
            <div style={{
              padding: 24,
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-card)',
              borderRadius: 12,
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: '10%',
                right: '10%',
                height: 1,
                background: 'linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.4), transparent)',
              }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t.forecast.bearCase}
                </span>
                <ShieldAlert size={16} color="#EF4444" />
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: 12 }}>
                10th Percentile (5%)
              </div>
              <div className="num-mono" style={{ fontSize: '24px', fontWeight: 700, color: '#EF4444', marginBottom: 6 }}>
                {formatPrice(forecast.bear_target)}
              </div>
              <div style={{ fontSize: '12px', color: '#EF4444', fontWeight: 500 }}>
                {(((forecast.bear_target - forecast.current_price) / forecast.current_price) * 100).toFixed(2)}%
                <span style={{ color: 'var(--text-secondary)', marginLeft: 6 }}>{t.chart.currentPrice}</span>
              </div>
            </div>

            {/* Base Target */}
            <div style={{
              padding: 24,
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-card)',
              borderRadius: 12,
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: '10%',
                right: '10%',
                height: 1,
                background: 'linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.4), transparent)',
              }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t.forecast.baseCase}
                </span>
                <Target size={16} color="var(--brand-primary)" />
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: 12 }}>
                {t.forecast.medianExpected}
              </div>
              <div className="num-mono" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--brand-primary)', marginBottom: 6 }}>
                {formatPrice(forecast.base_target)}
              </div>
              <div style={{ fontSize: '12px', color: forecast.base_target >= forecast.current_price ? '#10B981' : '#EF4444', fontWeight: 500 }}>
                {forecast.base_target >= forecast.current_price ? '+' : ''}
                {(((forecast.base_target - forecast.current_price) / forecast.current_price) * 100).toFixed(2)}%
                <span style={{ color: 'var(--text-secondary)', marginLeft: 6 }}>{t.forecast.daysLabel.replace('{days}', String(forecast.horizon_days))}</span>
              </div>
            </div>

            {/* Bullish Target */}
            <div style={{
              padding: 24,
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-card)',
              borderRadius: 12,
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: '10%',
                right: '10%',
                height: 1,
                background: 'linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.4), transparent)',
              }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t.forecast.bullCase}
                </span>
                <TrendingUp size={16} color="#10B981" />
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: 12 }}>
                {t.forecast.optimistic95}
              </div>
              <div className="num-mono" style={{ fontSize: '24px', fontWeight: 700, color: '#10B981', marginBottom: 6 }}>
                {formatPrice(forecast.bull_target)}
              </div>
              <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 500 }}>
                +{(((forecast.bull_target - forecast.current_price) / forecast.current_price) * 100).toFixed(2)}%
                <span style={{ color: 'var(--text-secondary)', marginLeft: 6 }}>{t.forecast.probProfit}</span>
              </div>
            </div>
          </div>

          {/* 2. Simulation Cone Card */}
          <div style={{
            padding: 24,
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-card)',
            borderRadius: 12,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  {t.forecast.title} (Simulation Cone)
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  {t.forecast.confidenceInterval}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 12, height: 3, backgroundColor: 'var(--brand-primary)' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>95% Confidence Band</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 12, height: 2, backgroundColor: 'var(--text-primary)' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>Median</span>
                </div>
              </div>
            </div>

            {/* SVG Visualizer */}
            <div style={{ width: '100%', height: 260, backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-card)', borderRadius: 8, padding: '16px 20px', position: 'relative' }}>
              <svg width="100%" height="100%" viewBox="0 0 800 240" preserveAspectRatio="none">
                {/* 95% Confidence Area */}
                <polygon
                  points="40,120 760,20 760,220"
                  fill="rgba(0, 229, 255, 0.04)"
                  stroke="var(--border-subtle)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />

                {/* 80% Confidence Area */}
                <polygon
                  points="40,120 760,50 760,190"
                  fill="rgba(0, 229, 255, 0.07)"
                  stroke="rgba(0, 229, 255, 0.25)"
                  strokeWidth="1"
                />

                {/* Sample simulation paths */}
                {forecast.simulation_sample_cone &&
                  forecast.simulation_sample_cone.map((path, idx) => {
                    if (!path || path.length < 2) return null;
                    const minP = forecast.confidence_low_95 * 0.95;
                    const maxP = forecast.confidence_high_95 * 1.05;
                    const range = maxP - minP || 1;

                    const points = path
                      .map((val, step) => {
                        const x = 40 + (step / (path.length - 1)) * 720;
                        const y = 220 - ((val - minP) / range) * 200;
                        return `${x},${y}`;
                      })
                      .join(' ');

                    const colors = [
                      'rgba(0, 229, 255, 0.35)',
                      'rgba(16, 185, 129, 0.35)',
                      'rgba(239, 68, 68, 0.25)',
                      'rgba(161, 161, 170, 0.3)',
                    ];

                    return (
                      <polyline
                        key={idx}
                        fill="none"
                        stroke={colors[idx % colors.length]}
                        strokeWidth="1.2"
                        points={points}
                      />
                    );
                  })}

                {/* Base Case Central Trendline */}
                <line x1="40" y1="120" x2="760" y2="105" stroke="var(--text-primary)" strokeWidth="2" strokeDasharray="4 4" />

                {/* Current Price Marker */}
                <circle cx="40" cy="120" r="5" fill="var(--brand-primary)" />
                <text x="45" y="145" fill="var(--text-primary)" fontSize="12" fontFamily="monospace">
                  {t.chart.currentPrice}: {formatPrice(forecast.current_price)}
                </text>
              </svg>
            </div>
          </div>

          {/* 3. Phan Tich Ky Thuat & Khang Cu - Ho Tro */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 16,
          }}>
            {/* Tin hieu & Diem so */}
            <div style={{
              padding: 24,
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-card)',
              borderRadius: 12,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Compass size={18} color="var(--brand-primary)" />
                  <h4 style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text-primary)', margin: 0 }}>
                    {t.forecast.technicalSignal}
                  </h4>
                </div>
                {getSignalBadge(forecast.trend_signal)}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>{t.forecast.technicalScore}</div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--brand-primary)', fontFamily: 'monospace' }}>
                    {forecast.technical_score}
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 400 }}>/100</span>
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ height: 8, borderRadius: 4, backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-card)', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${forecast.technical_score}%`,
                        backgroundColor: 'var(--brand-primary)',
                        transition: 'width 0.6s ease',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-card)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>RSI (14):</span>
                  <span style={{ fontWeight: 600, fontFamily: 'monospace', color: forecast.rsi_14 > 70 ? '#EF4444' : forecast.rsi_14 < 30 ? '#10B981' : 'var(--text-primary)' }}>
                    {forecast.rsi_14} ({forecast.rsi_14 > 70 ? t.forecast.rsiOverbought : forecast.rsi_14 < 30 ? t.forecast.rsiOversold : t.forecast.rsiNeutral})
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-card)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>MACD:</span>
                  <span style={{ fontWeight: 600, color: forecast.macd_signal.includes('BULLISH') ? '#10B981' : 'var(--text-primary)' }}>
                    {forecast.macd_signal}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{t.forecast.volatility}:</span>
                  <span style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                    {forecast.annual_volatility.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Vung Khang cu & Ho tro */}
            <div style={{
              padding: 24,
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-card)',
              borderRadius: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <Layers size={18} color="var(--brand-primary)" />
                <h4 style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text-primary)', margin: 0 }}>
                  {t.forecast.supportResistance}
                </h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#EF4444', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>
                    {t.forecast.resistanceLevels}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {forecast.resistance_levels.map((res, i) => (
                      <span
                        key={i}
                        style={{
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#EF4444',
                          padding: '6px 12px',
                          borderRadius: 6,
                          fontSize: '12px',
                          fontWeight: 600,
                          fontFamily: 'monospace',
                        }}
                      >
                        R{i + 1}: {formatPrice(res)}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#10B981', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>
                    {t.forecast.supportLevels}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {forecast.support_levels.map((sup, i) => (
                      <span
                        key={i}
                        style={{
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          color: '#10B981',
                          padding: '6px 12px',
                          borderRadius: 6,
                          fontSize: '12px',
                          fontWeight: 600,
                          fontFamily: 'monospace',
                        }}
                      >
                        S{i + 1}: {formatPrice(sup)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
