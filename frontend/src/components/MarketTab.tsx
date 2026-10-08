import React, { useEffect, useState } from 'react';
import type { MarketSummary, BenchmarkSeries, GoldCalculatorResult } from '../types';
import { fetchBenchmark, fetchGoldCalculator } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { ArrowUpRight, Calculator } from 'lucide-react';

interface MarketTabProps {
  summary: MarketSummary | null;
  onSelectAsset: (assetId: string) => void;
}

export const MarketTab: React.FC<MarketTabProps> = ({ summary, onSelectAsset }) => {
  const { formatMoney, currency, goldUnit } = useCurrency();
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
      <div className="glass-panel" style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Đang tải bảng giá thời gian thực...</p>
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Sub-tab Navigation */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12, flexWrap: 'wrap' }}>
        {[
          { id: 'gold', label: 'Bảng Giá Vàng SJC & Thế Giới' },
          { id: 'stock_vn', label: 'Chứng Khoán Việt Nam (HOSE/HNX)' },
          { id: 'global', label: 'Cổ Phiếu Mỹ & Crypto Toàn Cầu' },
          { id: 'calculator', label: 'Công Cụ Quy Đổi Vàng' },
          { id: 'benchmark', label: 'So Sánh Tăng Trưởng 12T (Benchmark)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id as any)}
            className="btn-ghost"
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: '0.85rem',
              borderColor: subTab === tab.id ? 'var(--accent-gold)' : 'var(--border-subtle)',
              color: subTab === tab.id ? 'var(--accent-gold)' : 'var(--text-muted)',
              background: subTab === tab.id ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. TAB: VÀNG VIỆT NAM & THẾ GIỚI */}
      {subTab === 'gold' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Top Gold Metrics Highlights */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
          }}>
            <div className="glass-panel glass-panel-gold" style={{ padding: 20 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', fontWeight: 600, marginBottom: 6 }}>
                VÀNG THẾ GIỚI SPOT (XAU/USD)
              </div>
              <div className="num-mono" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
                ${summary.world_gold_usd.toLocaleString('en-US', { minimumFractionDigits: 1 })}
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginLeft: 6 }}>/ounce</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--accent-green)', marginTop: 4 }}>
                +14.20 USD (+0.54%) trong 24h qua
              </div>
            </div>

            <div className="glass-panel" style={{ padding: 20 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>
                CHÊNH LỆCH VÀNG SJC VS THẾ GIỚI
              </div>
              <div className="num-mono" style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
                +{summary.gold_vn_spread.toFixed(2)} triệu
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginLeft: 6 }}>/lượng</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 4 }}>
                Tỷ giá quy đổi: {summary.usd_vnd_exchange.toLocaleString()} VND/USD
              </div>
            </div>

            <div className="glass-panel" style={{ padding: 20 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>
                HÀNH ĐỘNG KHUYẾN NGHỊ VÀNG
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                TÍCH SẢN ĐỊNH KỲ (DCA)
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 4 }}>
                Bảo vệ tài sản trước lạm phát và chu kỳ hạ lãi suất Fed
              </div>
            </div>
          </div>

          {/* Bảng chi tiết các thương hiệu vàng */}
          <div className="glass-panel" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                Bảng So Sánh Giá Vàng Trong Nước (SJC, DOJI, PNJ, BTMC)
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-gold)' }}>
                Đơn vị: {currency === 'USD' ? 'USD' : 'Triệu VND'} / {goldUnit === 'CHI' ? 'Chỉ' : goldUnit === 'OUNCE' ? 'Ounce (oz)' : 'Lượng'}
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="fin-table">
                <thead>
                  <tr>
                    <th>Thương Hiệu & Loại Vàng</th>
                    <th>Khu Vực</th>
                    <th>Giá Mua Vào</th>
                    <th>Giá Bán Ra</th>
                    <th>Chênh Lệch (Spread)</th>
                    <th>Cập Nhật</th>
                    <th style={{ textAlign: 'center' }}>Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.featured_gold.map((g) => (
                    <tr key={g.id}>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--accent-gold-light)' }}>
                          {g.brand}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-dim)' }}>{g.city}</td>
                      <td className="num-mono" style={{ fontWeight: 700, color: 'var(--accent-green)' }}>
                        {getGoldDisplayPrice(g.buy_price)}
                      </td>
                      <td className="num-mono" style={{ fontWeight: 700, color: 'var(--accent-gold)' }}>
                        {getGoldDisplayPrice(g.sell_price)}
                      </td>
                      <td className="num-mono" style={{ color: 'var(--text-muted)' }}>
                        {currency === 'USD' ? `$${((g.spread * 1_000_000) / (summary?.usd_vnd_exchange || 25450)).toFixed(1)}` : `${g.spread.toFixed(2)} tr`}
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                        {new Date(g.updated_at).toLocaleTimeString('vi-VN')}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => onSelectAsset('XAU-SJC')}
                          className="btn-ghost"
                          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                        >
                          Biểu đồ & Dự đoán <ArrowUpRight size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. TAB: CHỨNG KHOÁN VIỆT NAM */}
      {subTab === 'stock_vn' && (
        <div className="glass-panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
              Cổ Phiếu & Chỉ Số Hàng Đầu Thị Trường Việt Nam
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Sàn HOSE & HNX</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="fin-table">
              <thead>
                <tr>
                  <th>Mã CK</th>
                  <th>Tên Doanh Nghiệp</th>
                  <th>Giá Khớp Lệnh</th>
                  <th>Thay Đổi (VND)</th>
                  <th>% Thay Đổi</th>
                  <th>Khối Lượng</th>
                  <th>Cao / Thấp 24h</th>
                  <th style={{ textAlign: 'center' }}>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {vnStocks.map((stock) => {
                  const isUp = stock.change_percent >= 0;
                  return (
                    <tr key={stock.id}>
                      <td>
                        <span style={{ fontWeight: 800, color: '#60a5fa' }}>{stock.symbol}</span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{stock.name}</td>
                      <td className="num-mono" style={{ fontWeight: 700, color: isUp ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                        {stock.current_price.toLocaleString()} VND
                      </td>
                      <td className="num-mono" style={{ color: isUp ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                        {isUp ? '+' : ''}{stock.change_amount.toLocaleString()}
                      </td>
                      <td>
                        <span className={isUp ? 'badge-gain' : 'badge-loss'}>
                          {isUp ? '+' : ''}{stock.change_percent.toFixed(2)}%
                        </span>
                      </td>
                      <td className="num-mono" style={{ color: 'var(--text-dim)' }}>
                        {stock.volume.toLocaleString()}
                      </td>
                      <td className="num-mono" style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        {stock.high_24h.toLocaleString()} / {stock.low_24h.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => onSelectAsset(stock.id)}
                          className="btn-ghost"
                          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                        >
                          Biểu đồ & Dự đoán <ArrowUpRight size={13} />
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

      {/* 3. TAB: QUỐC TẾ & CRYPTO */}
      {subTab === 'global' && (
        <div className="glass-panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
              Cổ Phiếu Mỹ (US Stocks) & Tiền Điện Tử (Crypto)
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Định giá bằng USD</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="fin-table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Tài Sản</th>
                  <th>Sàn</th>
                  <th>Giá Hiện Tại (USD)</th>
                  <th>Biến Động 24h</th>
                  <th>Khối Lượng</th>
                  <th style={{ textAlign: 'center' }}>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {globalAssets.map((asset) => {
                  const isUp = asset.change_percent >= 0;
                  return (
                    <tr key={asset.id}>
                      <td style={{ fontWeight: 800, color: 'var(--accent-cyan)' }}>{asset.symbol}</td>
                      <td>{asset.name}</td>
                      <td style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>{asset.exchange}</td>
                      <td className="num-mono" style={{ fontWeight: 700, color: '#fff' }}>
                        ${asset.current_price.toLocaleString()}
                      </td>
                      <td>
                        <span className={isUp ? 'badge-gain' : 'badge-loss'}>
                          {isUp ? '+' : ''}{asset.change_percent.toFixed(2)}%
                        </span>
                      </td>
                      <td className="num-mono" style={{ color: 'var(--text-dim)' }}>
                        {asset.volume.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => onSelectAsset(asset.id)}
                          className="btn-ghost"
                          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                        >
                          Biểu đồ & Dự đoán <ArrowUpRight size={13} />
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

      {/* 4. TAB: CÔNG CỤ QUY ĐỔI & TÍNH TOÁN VÀNG */}
      {subTab === 'calculator' && calcResult && (
        <div className="glass-panel" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Calculator size={22} color="var(--accent-gold)" />
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                Công Cụ Tính Toán & Quy Đổi Giá Vàng SJC
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                Tính nhanh giá trị mua/bán, spread chênh lệch và mức chênh với vàng thế giới
              </p>
            </div>
          </div>

          {/* Form nhập số lượng */}
          <div style={{ maxWidth: 450, marginBottom: 24 }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: 8, fontWeight: 600 }}>
              SỐ LƯỢNG VÀNG CẦN TÍNH (LƯỢNG / CÂY)
            </label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input
                type="number"
                min="0.1"
                step="0.5"
                value={goldQtyLuong}
                onChange={(e) => setGoldQtyLuong(Math.max(0.1, parseFloat(e.target.value) || 1))}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border-gold)',
                  borderRadius: 10,
                  padding: '12px 18px',
                  color: 'var(--accent-gold-light)',
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  fontFamily: 'JetBrains Mono',
                  width: 160,
                  outline: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                {[1, 2, 5, 10, 20].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setGoldQtyLuong(preset)}
                    className="btn-ghost"
                    style={{
                      padding: '8px 12px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      borderColor: goldQtyLuong === preset ? 'var(--accent-gold)' : 'var(--border-subtle)',
                      color: goldQtyLuong === preset ? 'var(--accent-gold)' : 'var(--text-main)',
                    }}
                  >
                    {preset}L
                  </button>
                ))}
              </div>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 8 }}>
              Tương đương: <strong>{calcResult.quantity_chi} chỉ</strong> ({calcResult.quantity_grams} grams)
            </div>
          </div>

          {/* Grid kết quả tính toán */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 16,
          }}>
            <div className="glass-panel" style={{ padding: 20, borderLeft: '4px solid var(--accent-gold)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: 6 }}>TỔNG TIỀN MUA VÀO (GIÁ TIỆM MUA)</div>
              <div className="num-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-green)' }}>
                {formatVND(calcResult.total_buy_cost)}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 4 }}>
                Đơn giá: {calcResult.sjc_buy_price_lg} tr/lượng
              </div>
            </div>

            <div className="glass-panel glass-panel-gold" style={{ padding: 20 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', marginBottom: 6 }}>TỔNG TIỀN BÁN RA (KHÁCH MUA)</div>
              <div className="num-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>
                {formatVND(calcResult.total_sell_value)}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 4 }}>
                Đơn giá: {calcResult.sjc_sell_price_lg} tr/lượng ({calcResult.gold_price_per_chi}/chỉ)
              </div>
            </div>

            <div className="glass-panel" style={{ padding: 20, borderLeft: '4px solid var(--accent-cyan)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: 6 }}>CHÊNH LỆCH MUA - BÁN (SPREAD)</div>
              <div className="num-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                {formatVND(calcResult.total_spread_vnd)}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 4 }}>
                Biên lợi nhuận của nhà vàng
              </div>
            </div>

            <div className="glass-panel" style={{ padding: 20, borderLeft: '4px solid var(--accent-purple)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: 6 }}>CHÊNH LỆCH SO VỚI VÀNG THẾ GIỚI</div>
              <div className="num-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-purple)' }}>
                +{formatVND(calcResult.domestic_premium)}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 4 }}>
                Cao hơn thế giới: +{calcResult.premium_pct}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB: SO SÁNH BENCHMARK TĂNG TRƯỞNG */}
      {subTab === 'benchmark' && (
        <div className="glass-panel" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                So Sánh Hiệu Suất Tăng Trưởng 12 Tháng Qua (Performance Benchmark)
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                Đánh giá tỷ suất sinh lời lũy kế giữa Vàng SJC, S&P 500, VN-Index và Lãi suất tiết kiệm ngân hàng
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {benchmarks.map((b) => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
                  <span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: b.color }} />
                  <span style={{ color: 'var(--text-muted)' }}>{b.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cards tóm tắt tỷ suất 12T */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            marginBottom: 24,
          }}>
            {benchmarks.map((b) => {
              const lastPoint = b.points[b.points.length - 1];
              return (
                <div key={b.id} className="glass-panel" style={{ padding: 18, borderTop: `3px solid ${b.color}` }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: 4 }}>{b.name}</div>
                  <div className="num-mono" style={{ fontSize: '1.8rem', fontWeight: 800, color: b.color }}>
                    +{lastPoint?.return_pct}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 4 }}>
                    Tăng trưởng lũy kế 12 tháng
                  </div>
                </div>
              );
            })}
          </div>

          {/* Biểu đồ so sánh dạng thanh tăng trưởng */}
          <div style={{ overflowX: 'auto' }}>
            <table className="fin-table">
              <thead>
                <tr>
                  <th>Tài Sản Đầu Tư</th>
                  <th>Phân Loại</th>
                  <th>Tháng 11/25</th>
                  <th>Tháng 02/26</th>
                  <th>Tháng 05/26</th>
                  <th>Tháng 08/26</th>
                  <th>Hiện Tại (T10/26)</th>
                  <th>Đánh Giá Khuyến Nghị</th>
                </tr>
              </thead>
              <tbody>
                {benchmarks.map((b) => {
                  const p1 = b.points[0]?.return_pct || 0;
                  const p4 = b.points[3]?.return_pct || 0;
                  const p7 = b.points[6]?.return_pct || 0;
                  const p10 = b.points[9]?.return_pct || 0;
                  const pFinal = b.points[b.points.length - 1]?.return_pct || 0;
                  return (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 700, color: b.color }}>{b.name}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{b.asset_type}</td>
                      <td className="num-mono">+{p1}%</td>
                      <td className="num-mono">+{p4}%</td>
                      <td className="num-mono">+{p7}%</td>
                      <td className="num-mono">+{p10}%</td>
                      <td className="num-mono" style={{ fontWeight: 800, color: b.color, fontSize: '1rem' }}>
                        +{pFinal}%
                      </td>
                      <td>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '4px 8px',
                          borderRadius: 6,
                          background: pFinal > 20 ? 'rgba(245, 158, 11, 0.2)' : pFinal > 10 ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                          color: pFinal > 20 ? 'var(--accent-gold)' : pFinal > 10 ? '#60a5fa' : '#34d399',
                        }}>
                          {pFinal > 25 ? 'PHÒNG VỆ HÀNG ĐẦU' : pFinal > 20 ? 'TĂNG TRƯỞNG MẠNH' : pFinal > 10 ? 'TIỀM NĂNG TÍCH SẢN' : 'AN TOÀN CỐ ĐỊNH'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
