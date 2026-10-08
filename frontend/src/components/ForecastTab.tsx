import React, { useEffect, useState } from 'react';
import type { ForecastResult, Asset } from '../types';
import { fetchForecast } from '../services/api';
import { TrendingUp, Target, ShieldAlert, Cpu, Activity, Compass } from 'lucide-react';

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
  const [horizon, setHorizon] = useState<number>(30);
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const currentAsset = allAssets.find((a) => a.id === selectedAssetId) || allAssets[0];

  useEffect(() => {
    let active = true;
    setLoading(true);

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
        return <span className="badge-gain" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>MUA MẠNH (STRONG BUY)</span>;
      case 'BUY':
        return <span className="badge-gain" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>TÍCH LŨY (BUY)</span>;
      case 'SELL':
        return <span className="badge-loss" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>BÁN / HẠ TỶ TRỌNG (SELL)</span>;
      default:
        return <span className="badge-gold" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>THEO DÕI (NEUTRAL)</span>;
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
      {/* Top Selector & Meta */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Cpu size={20} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              Động Cơ Dự Đoán Định Lượng & Monte Carlo Song Song
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
              Tính toán 5,000 kịch bản ngẫu nhiên đa nhân xử lý trực tiếp trên Go Backend
            </p>
          </div>
        </div>

        {/* Horizon Switcher & Asset Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <select
            value={selectedAssetId}
            onChange={(e) => onSelectAsset(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="XAU-SJC">Vàng SJC (Việt Nam)</option>
            <option value="XAU-USD">Vàng Thế Giới (XAU/USD)</option>
            <option value="VN-INDEX">Chỉ Số VN-Index</option>
            <option value="VN-FPT">FPT Telecom & AI</option>
            <option value="VN-VCB">Vietcombank</option>
            <option value="VN-HPG">Tập đoàn Hoà Phát</option>
            <option value="US-NVDA">NVIDIA (NVDA)</option>
            <option value="US-AAPL">Apple (AAPL)</option>
            <option value="CRYPTO-BTC">Bitcoin (BTC)</option>
          </select>

          <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.04)', borderRadius: 8, padding: 2 }}>
            <button
              onClick={() => setHorizon(7)}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: 'none',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: horizon === 7 ? 'rgba(99, 102, 241, 0.4)' : 'transparent',
                color: horizon === 7 ? '#fff' : 'var(--text-dim)',
              }}
            >
              7 Ngày Tới
            </button>
            <button
              onClick={() => setHorizon(30)}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: 'none',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: horizon === 30 ? 'rgba(99, 102, 241, 0.4)' : 'transparent',
                color: horizon === 30 ? '#fff' : 'var(--text-dim)',
              }}
            >
              30 Ngày Tới
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="glass-panel" style={{ padding: 60, textAlign: 'center' }}>
          <Activity className="pulse-dot" size={24} style={{ color: 'var(--accent-cyan)', marginBottom: 16 }} />
          <p style={{ color: 'var(--text-muted)' }}>
            Đang chạy mô phỏng 5,000 chuỗi thời gian Monte Carlo song song trên Go...
          </p>
        </div>
      ) : forecast ? (
        <>
          {/* 1. Kịch bản 3 Cột (Bear, Base, Bull) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
          }}>
            {/* Bearish Target */}
            <div className="glass-panel" style={{ padding: 22, borderTop: '3px solid var(--accent-red)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-red)' }}>
                  KỊCH BẢN PHÒNG THỦ (BEAR CASE)
                </span>
                <ShieldAlert size={18} color="var(--accent-red)" />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 10 }}>
                Xác suất 10th Percentile (Bi quan)
              </div>
              <div className="num-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f87171', marginBottom: 6 }}>
                {formatPrice(forecast.bear_target)}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-red)' }}>
                {(((forecast.bear_target - forecast.current_price) / forecast.current_price) * 100).toFixed(2)}%
                <span style={{ color: 'var(--text-dim)', marginLeft: 6 }}>so với giá hiện tại</span>
              </div>
            </div>

            {/* Base Target */}
            <div className="glass-panel" style={{ padding: 22, borderTop: '3px solid var(--accent-gold)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
                  KỊCH BẢN CƠ SỞ (BASE / MEDIAN)
                </span>
                <Target size={18} color="var(--accent-gold)" />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 10 }}>
                Kỳ vọng trung bình 50th Percentile
              </div>
              <div className="num-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-gold-light)', marginBottom: 6 }}>
                {formatPrice(forecast.base_target)}
              </div>
              <div style={{ fontSize: '0.8rem', color: forecast.base_target >= forecast.current_price ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {forecast.base_target >= forecast.current_price ? '+' : ''}
                {(((forecast.base_target - forecast.current_price) / forecast.current_price) * 100).toFixed(2)}%
                <span style={{ color: 'var(--text-dim)', marginLeft: 6 }}>kỳ vọng sau {forecast.horizon_days} ngày</span>
              </div>
            </div>

            {/* Bullish Target */}
            <div className="glass-panel" style={{ padding: 22, borderTop: '3px solid var(--accent-green)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-green)' }}>
                  KỊCH BẢN LẠC QUAN (BULL CASE)
                </span>
                <TrendingUp size={18} color="var(--accent-green)" />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 10 }}>
                Xác suất 90th Percentile (Lạc quan)
              </div>
              <div className="num-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#4ade80', marginBottom: 6 }}>
                {formatPrice(forecast.bull_target)}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-green)' }}>
                +{(((forecast.bull_target - forecast.current_price) / forecast.current_price) * 100).toFixed(2)}%
                <span style={{ color: 'var(--text-dim)', marginLeft: 6 }}>tiềm năng bứt phá</span>
              </div>
            </div>
          </div>

          {/* 2. Biểu đồ Visual Monte Carlo Simulation Cone */}
          <div className="glass-panel" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                  Dải Nón Xác Suất Giá Mô Phỏng Monte Carlo (Geometric Brownian Motion)
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                  Khoảng tin cậy 95%: [{formatPrice(forecast.confidence_low_95)} — {formatPrice(forecast.confidence_high_95)}]
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem' }}>
                <span style={{ display: 'inline-block', width: 12, height: 2, backgroundColor: '#4ade80' }} /> Bull 90%
                <span style={{ display: 'inline-block', width: 12, height: 2, backgroundColor: '#f59e0b' }} /> Base 50%
                <span style={{ display: 'inline-block', width: 12, height: 2, backgroundColor: '#f87171' }} /> Bear 10%
              </div>
            </div>

            {/* SVG Visual Simulation Chart */}
            <div style={{ width: '100%', height: 240, position: 'relative' }}>
              <svg width="100%" height="100%" viewBox="0 0 800 240" preserveAspectRatio="none">
                {/* Background Grid */}
                <line x1="0" y1="60" x2="800" y2="60" stroke="rgba(255,255,255,0.05)" />
                <line x1="0" y1="120" x2="800" y2="120" stroke="rgba(255,255,255,0.05)" />
                <line x1="0" y1="180" x2="800" y2="180" stroke="rgba(255,255,255,0.05)" />

                {/* Shaded Monte Carlo Cone */}
                <polygon
                  points="40,120 760,40 760,200"
                  fill="url(#monteCarloGradient)"
                  opacity="0.25"
                />

                <defs>
                  <linearGradient id="monteCarloGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.05" />
                  </linearGradient>
                </defs>

                {/* Sample Simulation Paths */}
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
                      'rgba(56, 189, 248, 0.4)',
                      'rgba(168, 85, 247, 0.4)',
                      'rgba(244, 63, 94, 0.3)',
                      'rgba(16, 185, 129, 0.4)',
                      'rgba(245, 158, 11, 0.4)',
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
                <line x1="40" y1="120" x2="760" y2="105" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="4 4" />

                {/* Current Price Marker */}
                <circle cx="40" cy="120" r="5" fill="#6366f1" />
                <text x="45" y="140" fill="#cbd5e1" fontSize="12" fontFamily="JetBrains Mono">
                  Hiện tại: {formatPrice(forecast.current_price)}
                </text>
              </svg>
            </div>
          </div>

          {/* 3. Phân Tích Kỹ Thuật & Kháng Cự - Hỗ Trợ */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 16,
          }}>
            {/* Tín hiệu & Điểm số */}
            <div className="glass-panel" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Compass size={18} color="var(--accent-purple)" />
                  <h4 style={{ fontWeight: 700 }}>Đánh Giá Tín Hiệu & Xu Hướng</h4>
                </div>
                {getSignalBadge(forecast.trend_signal)}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>ĐIỂM KỸ THUẬT (0 - 100)</div>
                  <div className="num-mono" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                    {forecast.technical_score}
                    <span style={{ fontSize: '1rem', color: 'var(--text-dim)' }}>/100</span>
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${forecast.technical_score}%`,
                        background: 'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Chỉ số RSI (14 ngày):</span>
                  <span className="num-mono" style={{ fontWeight: 700, color: forecast.rsi_14 > 70 ? 'var(--accent-red)' : forecast.rsi_14 < 30 ? 'var(--accent-green)' : '#fff' }}>
                    {forecast.rsi_14} ({forecast.rsi_14 > 70 ? 'Quá Mua' : forecast.rsi_14 < 30 ? 'Quá Bán' : 'Cân Bằng'})
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Tín hiệu MACD (12, 26, 9):</span>
                  <span style={{ fontWeight: 700, color: forecast.macd_signal.includes('BULLISH') ? 'var(--accent-green)' : 'var(--text-main)' }}>
                    {forecast.macd_signal}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Độ biến động năm (Volatility):</span>
                  <span className="num-mono" style={{ fontWeight: 700 }}>
                    {forecast.annual_volatility.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Vùng Kháng cự & Hỗ trợ */}
            <div className="glass-panel" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Target size={18} color="var(--accent-gold)" />
                <h4 style={{ fontWeight: 700 }}>Vùng Cung Cầu: Kháng Cự & Hỗ Trợ</h4>
              </div>

              {/* Resistances */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--accent-red)', fontWeight: 700, marginBottom: 6 }}>
                  VÙNG KHÁNG CỰ (RESISTANCE LEVELS)
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {forecast.resistance_levels?.map((res, i) => (
                    <span
                      key={i}
                      className="num-mono"
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        background: 'rgba(244, 63, 94, 0.12)',
                        border: '1px solid rgba(244, 63, 94, 0.25)',
                        color: '#f87171',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                      }}
                    >
                      R{i + 1}: {formatPrice(res)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Supports */}
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--accent-green)', fontWeight: 700, marginBottom: 6 }}>
                  VÙNG HỖ TRỢ (SUPPORT LEVELS)
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {forecast.support_levels?.map((sup, i) => (
                    <span
                      key={i}
                      className="num-mono"
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        background: 'rgba(16, 185, 129, 0.12)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        color: '#4ade80',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                      }}
                    >
                      S{i + 1}: {formatPrice(sup)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
