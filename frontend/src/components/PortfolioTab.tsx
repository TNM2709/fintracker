import React, { useEffect, useState } from 'react';
import type { PortfolioSummary, DividendEvent, PortfolioAnalytics } from '../types';
import { fetchDividendCalendar, fetchPortfolioAnalytics } from '../services/api';
import { PortfolioAnalyticsCard } from './PortfolioAnalyticsCard';
import { DCACalculatorModal } from './DCACalculatorModal';
import { useCurrency } from '../context/CurrencyContext';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  ArrowUpRight,
  Trash2,
  RotateCcw,
  Award,
  Calendar,
  FileSpreadsheet,
} from 'lucide-react';

interface PortfolioTabProps {
  portfolio: PortfolioSummary | null;
  onSelectAsset: (assetId: string) => void;
  onDeleteTransaction: (id: string) => void;
  onResetPortfolio: () => void;
  onOpenAddModal: () => void;
}

export const PortfolioTab: React.FC<PortfolioTabProps> = ({
  portfolio,
  onSelectAsset,
  onDeleteTransaction,
  onResetPortfolio,
  onOpenAddModal,
}) => {
  const [dividendEvents, setDividendEvents] = useState<DividendEvent[]>([]);
  const [analytics, setAnalytics] = useState<PortfolioAnalytics | null>(null);
  const [isDCAModalOpen, setIsDCAModalOpen] = useState<boolean>(false);
  const { formatMoney } = useCurrency();
  const formatVND = (num: number) => formatMoney(num);

  useEffect(() => {
    fetchDividendCalendar()
      .then((events) => setDividendEvents(events))
      .catch((err) => console.error('Dividend calendar error:', err));

    fetchPortfolioAnalytics()
      .then((data) => setAnalytics(data))
      .catch((err) => console.error('Portfolio analytics error:', err));
  }, [portfolio]);

  if (!portfolio) {
    return (
      <div className="glass-panel" style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Đang tải dữ liệu danh mục đầu tư...</p>
      </div>
    );
  }

  const isProfitable = portfolio.total_unrealized_pnl >= 0;

  // Xuất file CSV danh mục
  const handleExportCSV = () => {
    let csvContent = '\uFEFF'; // UTF-8 BOM
    csvContent += 'BÁO CÁO DANH MỤC TÀI SẢN & LỢI TỨC - FINTRACKER PRO\n\n';
    csvContent += `Tổng Tài Sản Ròng:,"${formatVND(portfolio.total_net_worth)}"\n`;
    csvContent += `Tổng Vốn Đầu Tư:,"${formatVND(portfolio.total_cost_basis)}"\n`;
    csvContent += `Lãi/Lỗ Ròng:,"${formatVND(portfolio.total_unrealized_pnl)}" (${portfolio.total_pnl_rate.toFixed(2)}%)\n`;
    csvContent += `Tổng Cổ Tức Đã Thu:,"${formatVND(portfolio.total_dividends)}"\n\n`;

    csvContent += 'CHI TIẾT VỊ THẾ NẮM GIỮ (HOLDINGS)\n';
    csvContent += 'Mã,Tên Tài Sản,Khối Lượng,Giá Vốn DCA,Giá Thị Trường,Giá Trị Hiện Tại,Lãi/Lỗ %,Cổ Tức Thu,Tỷ Trọng %\n';

    portfolio.holdings.forEach((h) => {
      csvContent += `"${h.symbol}","${h.name}",${h.total_quantity},${h.avg_buy_price},${h.current_price},${h.current_value},${h.unrealized_pnl_rate.toFixed(2)}%,${h.dividends_collected},${h.portfolio_weight}%\n`;
    });

    csvContent += '\nLỊCH SỬ GIAO DỊCH\n';
    csvContent += 'Thời Gian,Loại,Mã,Khối Lượng,Giá Khớp,Tổng Giá Trị,Ghi Chú\n';
    portfolio.recent_transactions.forEach((tx) => {
      csvContent += `"${new Date(tx.transaction_date).toLocaleDateString('vi-VN')}","${tx.type}","${tx.asset_symbol}",${tx.quantity},${tx.price},${tx.total_amount},"${tx.notes || ''}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `danh_muc_tai_san_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 1. KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 16,
      }}>
        {/* Total Net Worth */}
        <div className="glass-panel glass-panel-gold" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-gold)' }}>
              TỔNG TÀI SẢN RÒNG (NET WORTH)
            </span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={18} color="var(--accent-gold)" />
            </div>
          </div>
          <div className="num-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: 6 }}>
            {formatVND(portfolio.total_net_worth)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Tổng vốn đầu tư: <span className="num-mono" style={{ color: 'var(--text-muted)' }}>{formatVND(portfolio.total_cost_basis)}</span>
          </div>
        </div>

        {/* Total PnL */}
        <div className="glass-panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isProfitable ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              LÃI / LỖ CHƯA CHỐT (PNL)
            </span>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: isProfitable ? 'var(--accent-green-bg)' : 'var(--accent-red-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {isProfitable ? <TrendingUp size={18} color="var(--accent-green)" /> : <TrendingDown size={18} color="var(--accent-red)" />}
            </div>
          </div>
          <div className="num-mono" style={{
            fontSize: '1.6rem',
            fontWeight: 800,
            color: isProfitable ? 'var(--accent-green)' : 'var(--accent-red)',
            marginBottom: 6,
          }}>
            {isProfitable ? '+' : ''}{formatVND(portfolio.total_unrealized_pnl)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Tỷ suất sinh lời: <span className="num-mono" style={{ fontWeight: 700, color: isProfitable ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {isProfitable ? '+' : ''}{portfolio.total_pnl_rate.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Total Dividends / Yields */}
        <div className="glass-panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>
              CỔ TỨC & LỢI TỨC ĐÃ THU
            </span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={18} color="var(--accent-cyan)" />
            </div>
          </div>
          <div className="num-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8', marginBottom: 6 }}>
            {formatVND(portfolio.total_dividends)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Dòng tiền thụ động từ cổ phiếu & tài sản
          </div>
        </div>

        {/* Annualized Yield */}
        <div className="glass-panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-purple)' }}>
              TỶ SUẤT LỢI TỨC ƯỚC TÍNH (YIELD)
            </span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={18} color="var(--accent-purple)" />
            </div>
          </div>
          <div className="num-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#c084fc', marginBottom: 6 }}>
            {portfolio.estimated_yield.toFixed(2)}% / năm
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Vượt trội lãi suất tiết kiệm ngân hàng
          </div>
        </div>
      </div>

      {/* 2. Portfolio Health Analytics & AI Insights */}
      <PortfolioAnalyticsCard
        analytics={analytics}
        onOpenDCAModal={() => setIsDCAModalOpen(true)}
      />

      {/* 3. Asset Allocation Bar & Actions */}
      <div className="glass-panel" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PieChart size={18} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Phân Bổ Tỷ Trọng Danh Mục Tài Sản</h3>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleExportCSV} className="btn-ghost" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
              <FileSpreadsheet size={14} color="var(--accent-green)" /> Xuất Báo Cáo CSV
            </button>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div style={{
          height: 12,
          width: '100%',
          borderRadius: 6,
          overflow: 'hidden',
          display: 'flex',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          marginBottom: 16,
        }}>
          {Object.entries(portfolio.asset_allocation).map(([category, pct], idx) => {
            const colors = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#06b6d4'];
            return (
              <div
                key={category}
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  backgroundColor: colors[idx % colors.length],
                  transition: 'width 0.4s ease',
                }}
                title={`${category}: ${pct}%`}
              />
            );
          })}
        </div>

        {/* Legend Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {Object.entries(portfolio.asset_allocation).map(([category, pct], idx) => {
            const colors = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#06b6d4'];
            return (
              <div key={category} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: colors[idx % colors.length] }} />
                <span style={{ color: 'var(--text-muted)' }}>{category}:</span>
                <span className="num-mono" style={{ fontWeight: 700, color: '#fff' }}>{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Lịch Nhận Cổ Tức & Ước Tính Dòng Tiền (Dividend Calendar) */}
      <div className="glass-panel" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={18} color="var(--accent-purple)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
              Lịch Nhận Cổ Tức & Ước Tính Dòng Tiền Dự Kiến
            </h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Tính theo số lượng cổ phiếu đang sở hữu
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="fin-table">
            <thead>
              <tr>
                <th>Mã CK</th>
                <th>Sự Kiện Chia Cổ Tức</th>
                <th>Ngày GDKHQ</th>
                <th>Ngày Thanh Toán</th>
                <th>Cổ Tức / CP</th>
                <th>Tỷ Suất (Yield)</th>
                <th>Dòng Tiền Dự Kiến Thu Về</th>
              </tr>
            </thead>
            <tbody>
              {dividendEvents.map((ev) => (
                <tr key={ev.id}>
                  <td>
                    <span style={{ fontWeight: 800, color: '#a78bfa' }}>{ev.symbol}</span>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{ev.name}</td>
                  <td className="num-mono" style={{ color: 'var(--text-muted)' }}>{ev.ex_date}</td>
                  <td className="num-mono" style={{ fontWeight: 600, color: 'var(--accent-green)' }}>{ev.pay_date}</td>
                  <td className="num-mono">
                    {ev.asset_id.includes('US') ? `$${ev.dividend_amount}` : `${ev.dividend_amount.toLocaleString()} VND`}
                  </td>
                  <td>
                    <span className="badge-gain" style={{ fontSize: '0.78rem' }}>
                      {ev.yield_pct}%
                    </span>
                  </td>
                  <td className="num-mono" style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '0.95rem' }}>
                    {ev.estimated_cash > 0 ? (ev.asset_id.includes('US') ? `$${ev.estimated_cash.toLocaleString()}` : formatVND(ev.estimated_cash)) : 'Chưa có vị thế'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Holdings Table */}
      <div className="glass-panel" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Chi Tiết Các Vị Thế Nắm Giữ (Holdings)</h3>
          <button onClick={onOpenAddModal} className="btn-primary" style={{ padding: '7px 14px', fontSize: '0.8rem' }}>
            + Mua Thêm Tài Sản
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="fin-table">
            <thead>
              <tr>
                <th>Tài Sản</th>
                <th>Khối Lượng</th>
                <th>Giá Vốn DCA</th>
                <th>Giá Hiện Tại</th>
                <th>Giá Trị Thị Trường</th>
                <th>Lãi / Lỗ</th>
                <th>Cổ Tức Thu</th>
                <th>Tỷ Trọng</th>
                <th style={{ textAlign: 'center' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.holdings.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        Chưa có vị thế nắm giữ nào trong sổ cái SQLite Database.
                      </p>
                      <button
                        onClick={onOpenAddModal}
                        className="btn-gold"
                        style={{ padding: '6px 16px', fontSize: '0.82rem' }}
                      >
                        + Thêm Giao Dịch Đầu Tiên
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                portfolio.holdings.map((h) => {
                  const isGain = h.unrealized_pnl >= 0;
                  const isUSD = h.currency === 'USD';
                  return (
                    <tr key={h.asset_id}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 700, color: h.asset_id.includes('XAU') ? 'var(--accent-gold)' : '#fff' }}>
                            {h.symbol}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{h.name}</span>
                        </div>
                      </td>
                      <td className="num-mono" style={{ fontWeight: 600 }}>
                        {h.total_quantity.toLocaleString()} {h.asset_id.includes('XAU') ? 'lượng' : 'CP'}
                      </td>
                      <td className="num-mono" style={{ color: 'var(--text-muted)' }}>
                        {isUSD ? `$${h.avg_buy_price.toLocaleString()}` : formatVND(h.avg_buy_price)}
                      </td>
                      <td className="num-mono" style={{ fontWeight: 700 }}>
                        {isUSD ? `$${h.current_price.toLocaleString()}` : formatVND(h.current_price)}
                      </td>
                      <td className="num-mono" style={{ fontWeight: 700, color: '#fff' }}>
                        {isUSD ? `$${h.current_value.toLocaleString()}` : formatVND(h.current_value)}
                      </td>
                      <td>
                        <span className={isGain ? 'badge-gain' : 'badge-loss'}>
                          {isGain ? '+' : ''}{h.unrealized_pnl_rate.toFixed(2)}%
                        </span>
                      </td>
                      <td className="num-mono" style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
                        {h.dividends_collected > 0 ? (isUSD ? `$${h.dividends_collected}` : formatVND(h.dividends_collected)) : '—'}
                      </td>
                      <td className="num-mono" style={{ fontWeight: 600 }}>
                        {h.portfolio_weight}%
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => onSelectAsset(h.asset_id)}
                          className="btn-ghost"
                          style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                        >
                          Biểu đồ & Dự đoán <ArrowUpRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Recent Transactions & Management */}
      <div className="glass-panel" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Lịch Sử Sổ Giao Dịch</h3>
          <button
            onClick={onResetPortfolio}
            className="btn-ghost"
            style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            title="Khôi phục về danh mục demo mẫu"
          >
            <RotateCcw size={13} /> Phục hồi dữ liệu mẫu
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="fin-table">
            <thead>
              <tr>
                <th>Thời Gian</th>
                <th>Loại</th>
                <th>Mã</th>
                <th>Khối Lượng</th>
                <th>Giá Khớp</th>
                <th>Tổng Giá Trị</th>
                <th>Ghi Chú</th>
                <th style={{ textAlign: 'center' }}>Xóa</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.recent_transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '28px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Chưa có lịch sử giao dịch nào. Mọi lệnh Mua/Bán/Cổ tức sẽ được lưu trữ an toàn trong SQLite Database.
                  </td>
                </tr>
              ) :
                portfolio.recent_transactions.map((tx) => (
                <tr key={tx.id}>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    {new Date(tx.transaction_date).toLocaleDateString('vi-VN')}
                  </td>
                  <td>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: 4,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: tx.type === 'BUY' ? 'rgba(59, 130, 246, 0.2)' : tx.type === 'DIVIDEND' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
                      color: tx.type === 'BUY' ? '#60a5fa' : tx.type === 'DIVIDEND' ? '#34d399' : '#f87171',
                    }}>
                      {tx.type === 'BUY' ? 'MUA' : tx.type === 'DIVIDEND' ? 'CỔ TỨC' : 'BÁN'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700 }}>{tx.asset_symbol}</td>
                  <td className="num-mono">{tx.quantity.toLocaleString()}</td>
                  <td className="num-mono">{tx.price.toLocaleString()}</td>
                  <td className="num-mono" style={{ fontWeight: 600 }}>{tx.total_amount.toLocaleString()}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{tx.notes || '—'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => onDeleteTransaction(tx.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-dim)',
                        cursor: 'pointer',
                        padding: 4,
                      }}
                      title="Xoá giao dịch"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Modal Mô phỏng Tích sản Lãi kép DCA */}
      <DCACalculatorModal
        isOpen={isDCAModalOpen}
        onClose={() => setIsDCAModalOpen(false)}
      />
    </div>
  );
};
