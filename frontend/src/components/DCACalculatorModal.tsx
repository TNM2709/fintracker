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
  const [monthlyAmount, setMonthlyAmount] = useState<number>(10000000);
  const [years, setYears] = useState<number>(5);
  const [expectedRoi, setExpectedRoi] = useState<number>(15);
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
      backgroundColor: 'rgba(9, 9, 11, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 16,
    }}>
      <div style={{
        maxWidth: 780,
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: 24,
        backgroundColor: '#18181B',
        border: '1px solid #27272A',
        borderRadius: 12,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              backgroundColor: '#27272A',
              border: '1px solid #3F3F46',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <TrendingUp size={20} color="#00E5FF" />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#FAFAFA', margin: 0, lineHeight: 1.2 }}>
                Kế Hoạch Tích Sản Định Kỳ & Lãi Kép (DCA)
              </h3>
              <p style={{ fontSize: '14px', color: '#A1A1AA', margin: '4px 0 0 0', lineHeight: 1.5 }}>
                Mô phỏng sức mạnh đầu tư đều đặn vào Vàng & Cổ phiếu tăng trưởng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#A1A1AA',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Input Controls */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          backgroundColor: '#09090B',
          border: '1px solid #3F3F46',
          borderRadius: 8,
          padding: 20,
          marginBottom: 24,
        }}>
          {/* So tien hang thang */}
          <div>
            <label style={{ fontSize: '12px', color: '#A1A1AA', fontWeight: 500, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Tiền đầu tư mỗi tháng
            </label>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#00E5FF', marginBottom: 10, fontFamily: 'monospace' }}>
              {formatVND(monthlyAmount)}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[5000000, 10000000, 20000000, 50000000].map((amt) => {
                const isSelected = monthlyAmount === amt;
                return (
                  <button
                    key={amt}
                    onClick={() => setMonthlyAmount(amt)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 500,
                      borderRadius: 8,
                      border: isSelected ? 'none' : '1px solid #3F3F46',
                      backgroundColor: isSelected ? '#00E5FF' : 'transparent',
                      color: isSelected ? '#09090B' : '#A1A1AA',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {amt / 1000000}tr
                  </button>
                );
              })}
            </div>
          </div>

          {/* Thoi gian tich san */}
          <div>
            <label style={{ fontSize: '12px', color: '#A1A1AA', fontWeight: 500, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Thời gian tích sản
            </label>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#00E5FF', marginBottom: 10, fontFamily: 'monospace' }}>
              {years} Năm ({years * 12} tháng)
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1, 3, 5, 10, 15].map((y) => {
                const isSelected = years === y;
                return (
                  <button
                    key={y}
                    onClick={() => setYears(y)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 500,
                      borderRadius: 8,
                      border: isSelected ? 'none' : '1px solid #3F3F46',
                      backgroundColor: isSelected ? '#00E5FF' : 'transparent',
                      color: isSelected ? '#09090B' : '#A1A1AA',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {y}N
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ty suat sinh loi ky vong */}
          <div>
            <label style={{ fontSize: '12px', color: '#A1A1AA', fontWeight: 500, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Lãi suất kỳ vọng
            </label>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#00E5FF', marginBottom: 10, fontFamily: 'monospace' }}>
              {expectedRoi}% / năm
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[10, 12, 15, 18, 22].map((r) => {
                const isSelected = expectedRoi === r;
                return (
                  <button
                    key={r}
                    onClick={() => setExpectedRoi(r)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 500,
                      borderRadius: 8,
                      border: isSelected ? 'none' : '1px solid #3F3F46',
                      backgroundColor: isSelected ? '#00E5FF' : 'transparent',
                      color: isSelected ? '#09090B' : '#A1A1AA',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {r}%
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Results Highlights */}
        {result && (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: 16,
              marginBottom: 24,
            }}>
              <div style={{
                padding: 16,
                backgroundColor: '#18181B',
                border: '1px solid #27272A',
                borderRadius: 12,
              }}>
                <div style={{ fontSize: '12px', color: '#A1A1AA', marginBottom: 4, fontWeight: 500 }}>VỐN GỐC TÍCH LŨY</div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#FAFAFA', fontFamily: 'monospace' }}>
                  {formatVND(result.total_deposited)}
                </div>
              </div>

              <div style={{
                padding: 16,
                backgroundColor: '#18181B',
                border: '1px solid #00E5FF',
                borderRadius: 12,
              }}>
                <div style={{ fontSize: '12px', color: '#00E5FF', marginBottom: 4, fontWeight: 500 }}>TỔNG TÀI SẢN TƯƠNG LAI</div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#00E5FF', fontFamily: 'monospace' }}>
                  {formatVND(result.final_asset_value)}
                </div>
              </div>

              <div style={{
                padding: 16,
                backgroundColor: '#18181B',
                border: '1px solid #27272A',
                borderRadius: 12,
              }}>
                <div style={{ fontSize: '12px', color: '#10B981', marginBottom: 4, fontWeight: 500 }}>LÃI KÉP SINH RA</div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#10B981', fontFamily: 'monospace' }}>
                  +{formatVND(result.final_compound_gain)}
                </div>
              </div>

              <div style={{
                padding: 16,
                backgroundColor: '#18181B',
                border: '1px solid #27272A',
                borderRadius: 12,
              }}>
                <div style={{ fontSize: '12px', color: '#A1A1AA', marginBottom: 4, fontWeight: 500 }}>VƯỢT TIẾT KIỆM (5.5%)</div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#00E5FF', fontFamily: 'monospace' }}>
                  +{formatVND(result.outperformance)}
                </div>
              </div>
            </div>

            {/* Bang tien trinh qua tung nam */}
            <div style={{
              overflowX: 'auto',
              border: '1px solid #27272A',
              borderRadius: 8,
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#09090B', borderBottom: '1px solid #3F3F46' }}>
                    <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 500, fontSize: '12px' }}>MỐC THỜI GIAN</th>
                    <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 500, fontSize: '12px' }}>VỐN GỐC</th>
                    <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 500, fontSize: '12px' }}>TỔNG TÀI SẢN LÃI KÉP</th>
                    <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 500, fontSize: '12px' }}>LÃI SINH RA</th>
                    <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 500, fontSize: '12px' }}>NẾU GỬI TIẾT KIỆM</th>
                  </tr>
                </thead>
                <tbody>
                  {result.yearly_points.slice(1).map((pt) => (
                    <tr
                      key={pt.year}
                      style={{
                        borderBottom: '1px solid #27272A',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#27272A')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#FAFAFA' }}>Năm Thứ {pt.year}</td>
                      <td style={{ padding: '12px 16px', color: '#A1A1AA', fontFamily: 'monospace' }}>{formatVND(pt.total_deposited)}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#00E5FF', fontFamily: 'monospace' }}>
                        {formatVND(pt.portfolio_value)}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#10B981', fontWeight: 500, fontFamily: 'monospace' }}>
                        +{formatVND(pt.compound_profit)}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#A1A1AA', fontFamily: 'monospace' }}>
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
