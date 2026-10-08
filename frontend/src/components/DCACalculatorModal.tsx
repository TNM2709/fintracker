import React, { useState, useEffect } from 'react';
import type { DCASimulationResult } from '../types';
import { fetchDCASimulator } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { X, TrendingUp } from 'lucide-react';

interface DCACalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DCACalculatorModal: React.FC<DCACalculatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { formatMoney } = useCurrency();
  const [monthlyAmount, setMonthlyAmount] = useState<number>(10000000); // 10 triệu
  const [years, setYears] = useState<number>(5);
  const [expectedRoi, setExpectedRoi] = useState<number>(15); // 15%/năm
  const [result, setResult] = useState<DCASimulationResult | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchDCASimulator(monthlyAmount, years, expectedRoi)
        .then((res) => setResult(res))
        .catch((err) => console.error('DCA fetch error:', err));
    }
  }, [isOpen, monthlyAmount, years, expectedRoi]);

  if (!isOpen) return null;

  const formatVND = (num: number) => formatMoney(num);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 16,
    }}>
      <div className="glass-panel" style={{
        maxWidth: 750,
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: 24,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-glow)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Kế Hoạch Tích Sản Định Kỳ & Lãi Kép (DCA)</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                Sức mạnh kỳ quan thứ 8: Đầu tư đều đặn vào Vàng & Cổ phiếu tăng trưởng
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Input Controls */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 14,
          padding: 18,
          marginBottom: 20,
        }}>
          {/* Số tiền hàng tháng */}
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 6 }}>
              TIỀN ĐẦU TƯ MỖI THÁNG
            </label>
            <div className="num-mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-green)', marginBottom: 6 }}>
              {formatVND(monthlyAmount)}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[5000000, 10000000, 20000000, 50000000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setMonthlyAmount(amt)}
                  className="btn-ghost"
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderColor: monthlyAmount === amt ? 'var(--accent-green)' : 'var(--border-subtle)',
                    color: monthlyAmount === amt ? 'var(--accent-green)' : 'var(--text-muted)',
                  }}
                >
                  {amt / 1000000}tr
                </button>
              ))}
            </div>
          </div>

          {/* Thời gian tích sản */}
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 6 }}>
              THỜI GIAN TÍCH SẢN
            </label>
            <div className="num-mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: 6 }}>
              {years} Năm ({years * 12} tháng)
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[1, 3, 5, 10, 15].map((y) => (
                <button
                  key={y}
                  onClick={() => setYears(y)}
                  className="btn-ghost"
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderColor: years === y ? 'var(--accent-cyan)' : 'var(--border-subtle)',
                    color: years === y ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  }}
                >
                  {y}N
                </button>
              ))}
            </div>
          </div>

          {/* Tỷ suất sinh lời kỳ vọng */}
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 6 }}>
              LÃI SUẤT KỲ VỌNG
            </label>
            <div className="num-mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-gold)', marginBottom: 6 }}>
              {expectedRoi}% / năm
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[10, 12, 15, 18, 22].map((r) => (
                <button
                  key={r}
                  onClick={() => setExpectedRoi(r)}
                  className="btn-ghost"
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderColor: expectedRoi === r ? 'var(--accent-gold)' : 'var(--border-subtle)',
                    color: expectedRoi === r ? 'var(--accent-gold)' : 'var(--text-muted)',
                  }}
                >
                  {r}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Highlights */}
        {result && (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: 14,
              marginBottom: 20,
            }}>
              <div className="glass-panel" style={{ padding: 18, borderTop: '3px solid #64748b' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 4 }}>VỐN GỐC TỰ TÍCH LŨY</div>
                <div className="num-mono" style={{ fontSize: '1.35rem', fontWeight: 800, color: '#cbd5e1' }}>
                  {formatVND(result.total_deposited)}
                </div>
              </div>

              <div className="glass-panel glass-panel-gold" style={{ padding: 18, borderTop: '3px solid var(--accent-gold)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', marginBottom: 4 }}>TỔNG TÀI SẢN TƯƠNG LAI</div>
                <div className="num-mono" style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
                  {formatVND(result.final_asset_value)}
                </div>
              </div>

              <div className="glass-panel" style={{ padding: 18, borderTop: '3px solid var(--accent-green)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-green)', marginBottom: 4 }}>LÃI KÉP SINH RA</div>
                <div className="num-mono" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-green)' }}>
                  +{formatVND(result.final_compound_gain)}
                </div>
              </div>

              <div className="glass-panel" style={{ padding: 18, borderTop: '3px solid var(--accent-cyan)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginBottom: 4 }}>VƯỢT TIẾT KIỆM NGÂN HÀNG</div>
                <div className="num-mono" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                  +{formatVND(result.outperformance)}
                </div>
              </div>
            </div>

            {/* Bảng tiến trình qua từng năm */}
            <div style={{ overflowX: 'auto', marginBottom: 10 }}>
              <table className="fin-table">
                <thead>
                  <tr>
                    <th>Mốc Thời Gian</th>
                    <th>Vốn Gốc Đã Nộp</th>
                    <th>Giá Trị Danh Mục Lãi Kép</th>
                    <th>Lợi Nhuận Tích Lũy</th>
                    <th>Nếu Gửi Tiết Kiệm (5.5%)</th>
                  </tr>
                </thead>
                <tbody>
                  {result.yearly_points.slice(1).map((pt) => (
                    <tr key={pt.year}>
                      <td style={{ fontWeight: 700 }}>Năm Thứ {pt.year}</td>
                      <td className="num-mono">{formatVND(pt.total_deposited)}</td>
                      <td className="num-mono" style={{ fontWeight: 800, color: 'var(--accent-gold-light)' }}>
                        {formatVND(pt.portfolio_value)}
                      </td>
                      <td className="num-mono" style={{ color: 'var(--accent-green)', fontWeight: 700 }}>
                        +{formatVND(pt.compound_profit)}
                      </td>
                      <td className="num-mono" style={{ color: 'var(--text-dim)' }}>
                        {formatVND(pt.bank_value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
