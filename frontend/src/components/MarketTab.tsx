import React, { useEffect, useState } from 'react';
import type { MarketSummary, BenchmarkSeries, GoldCalculatorResult } from '../types';
import { fetchBenchmark, fetchGoldCalculator } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { ArrowUpRight, Calculator, Globe, Scale, Sparkles, TrendingUp, BarChart2 } from 'lucide-react';

interface MarketTabProps {
  summary: MarketSummary | null;
  onSelectAsset: (assetId: string) => void;
}

export const MarketTab: React.FC<MarketTabProps> = ({ summary, onSelectAsset }) => {
  const { formatMoney, currency, goldUnit } = useCurrency();
  const { t } = useLanguage();
  const [subTab, setSubTab] = useState<'gold' | 'stock_vn' | 'global' | 'calculator' | 'benchmark'>('gold');

  // Gold Calculator State
  const [goldQtyLuong, setGoldQtyLuong] = useState<number>(5);
  const [calcResult, setCalcResult] = useState<GoldCalculatorResult | null>(null);

  // Benchmark Series State
  const [benchmarks, setBenchmarks] = useState<BenchmarkSeries[]>([]);

  useEffect(() => {
    fetchGoldCalculator(goldQtyLuong)
      .then((data) => setCalcResult(data))
      .catch((err) => console.error('Gold calculator error:', err));
  }, [goldQtyLuong, summary]);

  useEffect(() => {
    if (subTab === 'benchmark' && benchmarks.length === 0) {
      fetchBenchmark()
        .then((data) => setBenchmarks(data))
        .catch((err) => console.error('Benchmark fetch error:', err));
    }
  }, [subTab]);

  if (!summary) {
    return (
      <div style={{
        padding: 60,
        textAlign: 'center',
        backgroundColor: '#18181B',
        border: '1px solid #27272A',
        borderRadius: 12,
      }}>
        <div className="pulse-dot" style={{ backgroundColor: '#00E5FF', margin: '0 auto 16px auto', display: 'block' }} />
        <p style={{ color: '#FAFAFA', fontSize: '15px', fontWeight: 500 }}>Đang tải bảng giá thời gian thực...</p>
        <p style={{ color: '#A1A1AA', fontSize: '13px', marginTop: 4 }}>Đồng bộ dữ liệu SJC, HOSE, Nasdaq và Binance</p>
      </div>
    );
  }

  const formatVND = (num: number) => formatMoney(num);

  const getGoldDisplayPrice = (pricePerLuongMillion: number) => {
    let val = pricePerLuongMillion;
    if (goldUnit === 'CHI') {
      val = pricePerLuongMillion / 10;
    } else if (goldUnit === 'OUNCE') {
      val = pricePerLuongMillion * 0.829426;
    }
    if (currency === 'USD') {
      const usd = (val * 1_000_000) / (summary?.usd_vnd_exchange || 25450);
      return `$${usd.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
    }
    return val.toFixed(2);
  };

  const vnStocks = summary.all_assets.filter((a) => a.asset_type === 'STOCK_VN');
  const globalAssets = summary.all_assets.filter((a) => a.asset_type === 'STOCK_US' || a.asset_type === 'CRYPTO');

  // Brand badges helper
  const getBrandBadge = (brandName: string) => {
    if (brandName.includes('SJC')) {
      return { label: 'SJC', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.35)', icon: '🪙' };
    }
    if (brandName.includes('DOJI')) {
      return { label: 'DOJI', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.35)', icon: '💎' };
    }
    if (brandName.includes('PNJ')) {
      return { label: 'PNJ', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.35)', icon: '💠' };
    }
    if (brandName.includes('Minh Châu') || brandName.includes('BTMC')) {
      return { label: 'BTMC', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.35)', icon: '🐉' };
    }
    return { label: 'GOLD', color: '#A1A1AA', bg: 'rgba(113, 113, 122, 0.15)', border: 'rgba(113, 113, 122, 0.35)', icon: '✨' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Sleek Segmented Pill Sub-tab Switcher */}
      <div style={{
        display: 'flex',
        backgroundColor: '#09090B',
        border: '1px solid #27272A',
        borderRadius: 8,
        padding: 4,
        gap: 4,
        width: 'fit-content',
        flexWrap: 'wrap',
      }}>
        {[
          { id: 'gold', label: `🪙 ${t.market.sjcGold}` },
          { id: 'stock_vn', label: `🏢 ${t.market.vnStocks}` },
          { id: 'global', label: `🌐 ${t.market.usStocks} & ${t.market.crypto}` },
          { id: 'calculator', label: '🧮 Calculator' },
          { id: 'benchmark', label: '📊 12M Benchmark' },
        ].map((tab) => {
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              style={{
                padding: '7px 16px',
                borderRadius: 6,
                fontWeight: isActive ? 600 : 500,
                fontSize: '13px',
                border: 'none',
                color: isActive ? '#FAFAFA' : '#A1A1AA',
                backgroundColor: isActive ? '#27272A' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = '#FAFAFA';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = '#A1A1AA';
              }}
            >
              {tab.label}
              {isActive && (
                <span style={{
                  position: 'absolute',
                  bottom: -2,
                  left: '20%',
                  right: '20%',
                  height: 2,
                  backgroundColor: '#00E5FF',
                  borderRadius: 2,
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* 1. TAB: VANG VIET NAM & THE GIOI */}
      {subTab === 'gold' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Top Gold Metrics HUD Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
          }}>
            {/* World Gold Card */}
            <div style={{
              padding: 24,
              backgroundColor: '#18181B',
              border: '1px solid #27272A',
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: '11px', color: '#A1A1AA', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  VÀNG THẾ GIỚI SPOT (XAU/USD)
                </span>
                <Globe size={16} color="#00E5FF" />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#FAFAFA', fontFamily: 'monospace' }}>
                ${summary.world_gold_usd.toLocaleString('en-US', { minimumFractionDigits: 1 })}
                <span style={{ fontSize: '13px', color: '#A1A1AA', marginLeft: 6, fontWeight: 400 }}>/ounce</span>
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                marginTop: 6,
                padding: '2px 8px',
                borderRadius: 4,
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: '#10B981',
                fontSize: '12px',
                fontWeight: 600,
              }}>
                <TrendingUp size={12} />
                <span>+14.20 USD (+0.54%) trong 24h qua</span>
              </div>
            </div>

            {/* SJC vs World Spread */}
            <div style={{
              padding: 24,
              backgroundColor: '#18181B',
              border: '1px solid #27272A',
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: '11px', color: '#A1A1AA', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  CHÊNH LỆCH SJC VS THẾ GIỚI
                </span>
                <Scale size={16} color="#10B981" />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#10B981', fontFamily: 'monospace' }}>
                +{summary.gold_vn_spread.toFixed(2)} triệu
                <span style={{ fontSize: '13px', color: '#A1A1AA', marginLeft: 6, fontWeight: 400 }}>/lượng</span>
              </div>
              <div style={{ fontSize: '12px', color: '#A1A1AA', marginTop: 6 }}>
                Tỷ giá quy đổi VCB: <strong style={{ color: '#FAFAFA', fontFamily: 'monospace' }}>{summary.usd_vnd_exchange.toLocaleString()} VND/USD</strong>
              </div>
            </div>

            {/* Recommendation Strategy */}
            <div style={{
              padding: 24,
              backgroundColor: '#18181B',
              border: '1px solid #27272A',
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
                background: 'linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.4), transparent)',
              }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: '11px', color: '#A1A1AA', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  CHIẾN LƯỢC KHUYẾN NGHỊ
                </span>
                <Sparkles size={16} color="#F59E0B" />
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#F59E0B' }}>
                TÍCH SẢN ĐỊNH KỲ (DCA)
              </div>
              <div style={{ fontSize: '12px', color: '#A1A1AA', marginTop: 6 }}>
                Bảo vệ giá trị danh mục trước lạm phát và chu kỳ nới lỏng tiền tệ
              </div>
            </div>
          </div>

          {/* Bang chi tiet cac thuong hieu vang */}
          <div style={{
            padding: 24,
            backgroundColor: '#18181B',
            border: '1px solid #27272A',
            borderRadius: 12,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#FAFAFA', margin: 0 }}>
                  Bảng So Sánh Giá Vàng Trong Nước (SJC, DOJI, PNJ, BTMC)
                </h3>
                <p style={{ fontSize: '13px', color: '#A1A1AA', margin: '4px 0 0 0' }}>
                  Cập nhật liên tục từ bảng giá các thương hiệu vàng lớn tại Hà Nội và TP.HCM
                </p>
              </div>
              <span style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#00E5FF',
                backgroundColor: 'rgba(0, 229, 255, 0.1)',
                border: '1px solid rgba(0, 229, 255, 0.25)',
                padding: '4px 10px',
                borderRadius: 6,
              }}>
                Đơn vị: {currency === 'USD' ? 'USD' : 'Triệu VND'} / {goldUnit === 'CHI' ? 'Chỉ' : goldUnit === 'OUNCE' ? 'Ounce (oz)' : 'Lượng'}
              </span>
            </div>

            <div style={{ overflowX: 'auto', border: '1px solid #27272A', borderRadius: 8 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#09090B', borderBottom: '1px solid #3F3F46' }}>
                    <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>THƯƠNG HIỆU & LOẠI VÀNG</th>
                    <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>KHU VỰC</th>
                    <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>GIÁ MUA VÀO</th>
                    <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>GIÁ BÁN RA</th>
                    <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CHÊNH LỆCH (SPREAD)</th>
                    <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CẬP NHẬT</th>
                    <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>HÀNH ĐỘNG</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.featured_gold.map((g) => {
                    const badge = getBrandBadge(g.brand);
                    return (
                      <tr
                        key={g.id}
                        style={{ borderBottom: '1px solid #27272A', transition: 'background-color 0.15s ease' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#27272A')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 32,
                              height: 32,
                              borderRadius: 6,
                              backgroundColor: badge.bg,
                              border: `1px solid ${badge.border}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '15px',
                              flexShrink: 0,
                            }}>
                              {badge.icon}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: '#FAFAFA' }}>{g.brand}</div>
                              <span style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                color: badge.color,
                                backgroundColor: badge.bg,
                                border: `1px solid ${badge.border}`,
                                padding: '1px 5px',
                                borderRadius: 4,
                                marginTop: 2,
                                display: 'inline-block',
                              }}>
                                {badge.label}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', color: '#A1A1AA' }}>{g.city}</td>
                        <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontWeight: 600, color: '#10B981' }}>
                          {getGoldDisplayPrice(g.buy_price)}
                        </td>
                        <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontWeight: 600, color: '#FAFAFA' }}>
                          {getGoldDisplayPrice(g.sell_price)}
                        </td>
                        <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: '#00E5FF', fontWeight: 500 }}>
                          {currency === 'USD' ? `$${((g.spread * 1_000_000) / (summary?.usd_vnd_exchange || 25450)).toFixed(1)}` : `${g.spread.toFixed(2)} tr`}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '12px', color: '#A1A1AA', fontFamily: 'monospace' }}>
                          {new Date(g.updated_at).toLocaleTimeString('vi-VN')}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <button
                            onClick={() => onSelectAsset('XAU-SJC')}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: 500,
                              backgroundColor: '#09090B',
                              border: '1px solid #3F3F46',
                              borderRadius: 6,
                              color: '#FAFAFA',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#27272A';
                              e.currentTarget.style.borderColor = '#00E5FF';
                              e.currentTarget.style.color = '#00E5FF';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#09090B';
                              e.currentTarget.style.borderColor = '#3F3F46';
                              e.currentTarget.style.color = '#FAFAFA';
                            }}
                          >
                            Biểu đồ <ArrowUpRight size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. TAB: CHUNG KHOAN VIET NAM */}
      {subTab === 'stock_vn' && (
        <div style={{
          padding: 24,
          backgroundColor: '#18181B',
          border: '1px solid #27272A',
          borderRadius: 12,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#FAFAFA', margin: 0 }}>
                Cổ Phiếu & Chỉ Số Hàng Đầu Thị Trường Việt Nam
              </h3>
              <p style={{ fontSize: '13px', color: '#A1A1AA', margin: '4px 0 0 0' }}>
                Dữ liệu khớp lệnh sàn HOSE & HNX thời gian thực
              </p>
            </div>
            <span style={{ fontSize: '12px', color: '#00E5FF', fontWeight: 600, backgroundColor: 'rgba(0, 229, 255, 0.1)', border: '1px solid rgba(0, 229, 255, 0.25)', padding: '4px 10px', borderRadius: 6 }}>
              {vnStocks.length} Mã Cổ Phiếu
            </span>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid #27272A', borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#09090B', borderBottom: '1px solid #3F3F46' }}>
                  <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>MÃ CK</th>
                  <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TÊN DOANH NGHIỆP</th>
                  <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>GIÁ KHỚP LỆNH</th>
                  <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>THAY ĐỔI (VND)</th>
                  <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>% BIẾN ĐỘNG</th>
                  <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>KHỐI LƯỢNG</th>
                  <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>BIÊN ĐỘ 24H</th>
                  <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>HÀNH ĐỘNG</th>
                </tr>
              </thead>
              <tbody>
                {vnStocks.map((stock) => {
                  const isUp = stock.change_percent >= 0;
                  return (
                    <tr
                      key={stock.id}
                      style={{ borderBottom: '1px solid #27272A', transition: 'background-color 0.15s ease' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#27272A')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontWeight: 600, color: '#00E5FF', fontSize: '14px' }}>{stock.symbol}</span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#FAFAFA' }}>{stock.name}</td>
                      <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontWeight: 600, color: '#FAFAFA' }}>
                        {stock.symbol.includes('INDEX') ? `${stock.current_price.toFixed(2)} pts` : `${stock.current_price.toLocaleString()} VND`}
                      </td>
                      <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: isUp ? '#10B981' : '#EF4444' }}>
                        {isUp ? '+' : ''}{stock.symbol.includes('INDEX') ? stock.change_amount.toFixed(2) : stock.change_amount.toLocaleString()}{stock.symbol.includes('INDEX') ? ' pts' : ''}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: 4,
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: isUp ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          border: isUp ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                          color: isUp ? '#10B981' : '#EF4444',
                          fontFamily: 'monospace',
                        }}>
                          {isUp ? '▲ +' : '▼ '}{stock.change_percent.toFixed(2)}%
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: '#A1A1AA' }}>
                        {stock.volume.toLocaleString()}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '12px', color: '#A1A1AA', fontFamily: 'monospace' }}>
                        {stock.high_24h.toLocaleString()} / {stock.low_24h.toLocaleString()}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <button
                          onClick={() => onSelectAsset(stock.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 500,
                            backgroundColor: '#09090B',
                            border: '1px solid #3F3F46',
                            borderRadius: 6,
                            color: '#FAFAFA',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#27272A';
                            e.currentTarget.style.borderColor = '#00E5FF';
                            e.currentTarget.style.color = '#00E5FF';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#09090B';
                            e.currentTarget.style.borderColor = '#3F3F46';
                            e.currentTarget.style.color = '#FAFAFA';
                          }}
                        >
                          Biểu đồ <ArrowUpRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. TAB: CO PHIEU MY & CRYPTO */}
      {subTab === 'global' && (
        <div style={{
          padding: 24,
          backgroundColor: '#18181B',
          border: '1px solid #27272A',
          borderRadius: 12,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#FAFAFA', margin: 0 }}>
                Thị Trường Tài Chính Quốc Tế & Tiền Điện Tử
              </h3>
              <p style={{ fontSize: '13px', color: '#A1A1AA', margin: '4px 0 0 0' }}>
                Cổ phiếu US Tech (Nasdaq) và Crypto (Binance) cập nhật 24/7
              </p>
            </div>
            <span style={{ fontSize: '12px', color: '#00E5FF', fontWeight: 600, backgroundColor: 'rgba(0, 229, 255, 0.1)', border: '1px solid rgba(0, 229, 255, 0.25)', padding: '4px 10px', borderRadius: 6 }}>
              {globalAssets.length} Tài Sản Quốc Tế
            </span>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid #27272A', borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#09090B', borderBottom: '1px solid #3F3F46' }}>
                  <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>MÃ / TÀI SẢN</th>
                  <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TÊN ĐẦY ĐỦ</th>
                  <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>LOẠI TÀI SẢN</th>
                  <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>GIÁ THỊ TRƯỜNG</th>
                  <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>% BIẾN ĐỘNG 24H</th>
                  <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>KHỐI LƯỢNG 24H</th>
                  <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>HÀNH ĐỘNG</th>
                </tr>
              </thead>
              <tbody>
                {globalAssets.map((asset) => {
                  const isUp = asset.change_percent >= 0;
                  const isCrypto = asset.asset_type === 'CRYPTO';
                  return (
                    <tr
                      key={asset.id}
                      style={{ borderBottom: '1px solid #27272A', transition: 'background-color 0.15s ease' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#27272A')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontWeight: 600, color: '#00E5FF', fontSize: '14px' }}>{asset.symbol}</span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#FAFAFA' }}>{asset.name}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: 4,
                          backgroundColor: isCrypto ? 'rgba(249, 115, 22, 0.15)' : 'rgba(0, 229, 255, 0.15)',
                          border: isCrypto ? '1px solid rgba(249, 115, 22, 0.35)' : '1px solid rgba(0, 229, 255, 0.35)',
                          color: isCrypto ? '#F97316' : '#00E5FF',
                        }}>
                          {isCrypto ? 'CRYPTO' : 'US-STOCK'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontWeight: 600, color: '#FAFAFA' }}>
                        ${asset.current_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: 4,
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: isUp ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          border: isUp ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                          color: isUp ? '#10B981' : '#EF4444',
                          fontFamily: 'monospace',
                        }}>
                          {isUp ? '▲ +' : '▼ '}{asset.change_percent.toFixed(2)}%
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: '#A1A1AA' }}>
                        {asset.volume.toLocaleString()}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <button
                          onClick={() => onSelectAsset(asset.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 500,
                            backgroundColor: '#09090B',
                            border: '1px solid #3F3F46',
                            borderRadius: 6,
                            color: '#FAFAFA',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#27272A';
                            e.currentTarget.style.borderColor = '#00E5FF';
                            e.currentTarget.style.color = '#00E5FF';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#09090B';
                            e.currentTarget.style.borderColor = '#3F3F46';
                            e.currentTarget.style.color = '#FAFAFA';
                          }}
                        >
                          Biểu đồ <ArrowUpRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. TAB: CONG CU QUY DOI VANG */}
      {subTab === 'calculator' && (
        <div style={{
          padding: 24,
          backgroundColor: '#18181B',
          border: '1px solid #27272A',
          borderRadius: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <Calculator size={18} color="#00E5FF" />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#FAFAFA', margin: 0 }}>
              Công Cụ Quy Đổi Giá Trị Vàng SJC & Spot Thế Giới
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#A1A1AA', marginBottom: 8, fontWeight: 500 }}>
                Nhập số lượng vàng (Lượng / Cây):
              </label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={goldQtyLuong}
                  onChange={(e) => setGoldQtyLuong(parseFloat(e.target.value) || 0)}
                  style={{
                    backgroundColor: '#09090B',
                    border: '1px solid #3F3F46',
                    borderRadius: 8,
                    padding: '10px 14px',
                    color: '#FAFAFA',
                    fontSize: '16px',
                    fontFamily: 'monospace',
                    width: 160,
                  }}
                />
                {/* Presets */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[1, 2, 5, 10, 20, 50].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setGoldQtyLuong(preset)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        fontSize: '12px',
                        fontWeight: goldQtyLuong === preset ? 600 : 500,
                        backgroundColor: goldQtyLuong === preset ? 'rgba(0, 229, 255, 0.15)' : '#09090B',
                        border: goldQtyLuong === preset ? '1px solid #00E5FF' : '1px solid #27272A',
                        color: goldQtyLuong === preset ? '#00E5FF' : '#A1A1AA',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {preset} lượng
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {calcResult && (
            <div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 16,
                marginBottom: 20,
              }}>
                <div style={{ backgroundColor: '#09090B', border: '1px solid #27272A', borderRadius: 8, padding: 18 }}>
                  <div style={{ fontSize: '11px', color: '#A1A1AA', fontWeight: 600, textTransform: 'uppercase' }}>
                    GIÁ TRỊ MUA VÀO SJC (VND)
                  </div>
                  <div className="num-mono" style={{ fontSize: '22px', fontWeight: 700, color: '#FAFAFA', marginTop: 6 }}>
                    {formatVND(calcResult.total_buy_cost)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#71717A', marginTop: 4 }}>
                    Đơn giá: {formatVND(calcResult.sjc_buy_price_lg)} / lượng
                  </div>
                </div>

                <div style={{ backgroundColor: '#09090B', border: '1px solid #27272A', borderRadius: 8, padding: 18 }}>
                  <div style={{ fontSize: '11px', color: '#A1A1AA', fontWeight: 600, textTransform: 'uppercase' }}>
                    GIÁ TRỊ THẾ GIỚI QUY ĐỔI (VND)
                  </div>
                  <div className="num-mono" style={{ fontSize: '22px', fontWeight: 700, color: '#00E5FF', marginTop: 6 }}>
                    {formatVND(calcResult.world_equiv_value)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#71717A', marginTop: 4 }}>
                    ≈ ${(calcResult.world_equiv_value / (summary?.usd_vnd_exchange || 25450)).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} USD (Spot XAU)
                  </div>
                </div>

                <div style={{ backgroundColor: '#09090B', border: '1px solid #27272A', borderRadius: 8, padding: 18 }}>
                  <div style={{ fontSize: '11px', color: '#A1A1AA', fontWeight: 600, textTransform: 'uppercase' }}>
                    CHÊNH LỆCH PHÍ PREMIUM SJC
                  </div>
                  <div className="num-mono" style={{ fontSize: '22px', fontWeight: 700, color: '#10B981', marginTop: 6 }}>
                    +{formatVND(calcResult.domestic_premium)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#10B981', marginTop: 4, fontWeight: 500 }}>
                    Cao hơn thế giới +{calcResult.premium_pct.toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* Visual Arbitrage Ratio Bar */}
              <div style={{
                backgroundColor: '#09090B',
                border: '1px solid #27272A',
                borderRadius: 8,
                padding: '16px 20px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#A1A1AA', marginBottom: 8 }}>
                  <span>Phân tích Chênh Lệch Giá Nội Địa vs Thế Giới:</span>
                  <span style={{ color: '#00E5FF', fontWeight: 600 }}>Phí bảo hiểm thương hiệu: {calcResult.premium_pct.toFixed(2)}%</span>
                </div>
                <div style={{
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: '#27272A',
                  overflow: 'hidden',
                  display: 'flex',
                }}>
                  <div style={{ width: `${Math.min(100, (calcResult.world_equiv_value / calcResult.total_buy_cost) * 100)}%`, backgroundColor: '#00E5FF' }} title="Giá trị vàng thế giới" />
                  <div style={{ width: `${Math.min(30, (calcResult.domestic_premium / calcResult.total_buy_cost) * 100)}%`, backgroundColor: '#10B981' }} title="Chênh lệch trong nước" />
                </div>
                <div style={{ display: 'flex', gap: 20, fontSize: '11px', color: '#71717A', marginTop: 8 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#00E5FF' }} /> Giá vàng thực tế (XAU)
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#10B981' }} /> Premium thương hiệu SJC ({calcResult.premium_pct.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. TAB: BENCHMARK */}
      {subTab === 'benchmark' && (
        <div style={{
          padding: 24,
          backgroundColor: '#18181B',
          border: '1px solid #27272A',
          borderRadius: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <BarChart2 size={18} color="#00E5FF" />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#FAFAFA', margin: 0 }}>
              So Sánh Hiệu Suất Tăng Trưởng 12 Tháng Qua
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
            {benchmarks.map((bm) => {
              const lastPct = bm.points && bm.points.length > 0 ? bm.points[bm.points.length - 1].return_pct : 0;
              const isGain = lastPct >= 0;
              const strokeColor = bm.color || (bm.id.includes('GOLD') ? '#F59E0B' : bm.id.includes('SP500') ? '#8B5CF6' : bm.id.includes('VNINDEX') ? '#3B82F6' : '#10B981');
              return (
                <div key={bm.id} style={{
                  backgroundColor: '#09090B',
                  border: '1px solid #27272A',
                  borderTop: `3px solid ${strokeColor}`,
                  borderRadius: 8,
                  padding: 18,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#FAFAFA' }}>{bm.name}</span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: '12px',
                      fontWeight: 700,
                      backgroundColor: isGain ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                      color: isGain ? '#10B981' : '#EF4444',
                      fontFamily: 'monospace',
                    }}>
                      {isGain ? '+' : ''}{lastPct.toFixed(2)}%
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#A1A1AA', marginTop: 4 }}>Loại: {bm.asset_type}</div>
                </div>
              );
            })}
          </div>

          {/* SVG 12-Month Performance Comparison Chart */}
          <div style={{
            backgroundColor: '#09090B',
            border: '1px solid #27272A',
            borderRadius: 8,
            padding: 20,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#FAFAFA' }}>
                Đồ Thị Tỷ Suất Sinh Lời Tích Lũy 12 Tháng (Normalized Baseline 0%)
              </span>
              <div style={{ display: 'flex', gap: 16, fontSize: '11px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#F59E0B' }}>
                  <span style={{ width: 12, height: 3, backgroundColor: '#F59E0B' }} /> Vàng SJC
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#00E5FF' }}>
                  <span style={{ width: 12, height: 3, backgroundColor: '#00E5FF' }} /> S&P 500
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#10B981' }}>
                  <span style={{ width: 12, height: 3, backgroundColor: '#10B981' }} /> VN-Index
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#A855F7' }}>
                  <span style={{ width: 12, height: 3, backgroundColor: '#A855F7' }} /> Lãi Suất 12T
                </span>
              </div>
            </div>

            <div style={{ width: '100%', height: 260, position: 'relative' }}>
              <svg viewBox="0 0 850 240" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                {/* Horizontal Grid lines */}
                <line x1="50" y1="30" x2="800" y2="30" stroke="#27272A" strokeDasharray="3 3" />
                <text x="40" y="34" fill="#71717A" fontSize="10" textAnchor="end">+30%</text>

                <line x1="50" y1="80" x2="800" y2="80" stroke="#27272A" strokeDasharray="3 3" />
                <text x="40" y="84" fill="#71717A" fontSize="10" textAnchor="end">+20%</text>

                <line x1="50" y1="130" x2="800" y2="130" stroke="#27272A" strokeDasharray="3 3" />
                <text x="40" y="134" fill="#71717A" fontSize="10" textAnchor="end">+10%</text>

                {/* 0% Baseline */}
                <line x1="50" y1="180" x2="800" y2="180" stroke="#3F3F46" strokeWidth="1.5" />
                <text x="40" y="184" fill="#A1A1AA" fontSize="11" fontWeight="600" textAnchor="end">0%</text>

                {/* Render Curves */}
                {benchmarks.map((bm) => {
                  const strokeColor = bm.color || (bm.id.includes('GOLD') ? '#F59E0B' : bm.id.includes('SP500') ? '#8B5CF6' : bm.id.includes('VNINDEX') ? '#3B82F6' : '#10B981');
                  if (!bm.points || bm.points.length === 0) return null;
                  
                  const count = bm.points.length;
                  const stepX = 750 / Math.max(1, count - 1);
                  
                  const d = bm.points.map((pt, i) => {
                    const x = 50 + i * stepX;
                    // Scale: 0% at y=180, +30% at y=30 (5px per 1%)
                    const y = Math.max(20, Math.min(220, 180 - pt.return_pct * 5));
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ');

                  const lastPt = bm.points[bm.points.length - 1];
                  const lastX = 50 + (count - 1) * stepX;
                  const lastY = Math.max(20, Math.min(220, 180 - lastPt.return_pct * 5));

                  return (
                    <g key={bm.id}>
                      <path d={d} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx={lastX} cy={lastY} r="4" fill={strokeColor} />
                    </g>
                  );
                })}

                {/* X Axis Labels */}
                {['T-11', 'T-10', 'T-9', 'T-8', 'T-7', 'T-6', 'T-5', 'T-4', 'T-3', 'T-2', 'T-1', 'Hiện tại'].map((m, idx) => (
                  <text key={idx} x={50 + idx * (750 / 11)} y="210" fill="#71717A" fontSize="10" textAnchor="middle">
                    {m}
                  </text>
                ))}
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
