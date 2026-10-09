import React, { useState, useEffect } from 'react';
import type { DCASimulationResult } from '../types';
import { fetchDCASimulator } from '../services/api';
import { useCurrency } from '../context/useCurrency';
import { useLanguage } from '../context/useLanguage';
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
  const { t } = useLanguage();
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
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-card)',
        borderRadius: 12,
        color: 'var(--text-primary)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
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
            }}>
              <TrendingUp size={20} color="var(--brand-primary)" />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>
                {t.dca.planTitle}
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: 1.5 }}>
                {t.dca.planSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
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
          backgroundColor: 'var(--bg-body)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 8,
          padding: 20,
          marginBottom: 24,
        }}>
          {/* So tien hang thang */}
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t.dca.monthlyInvest}
            </label>
            <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--brand-primary)', marginBottom: 10, fontFamily: 'monospace' }}>
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
                      border: isSelected ? 'none' : '1px solid var(--border-subtle)',
                      backgroundColor: isSelected ? 'var(--brand-primary)' : 'transparent',
                      color: isSelected ? '#09090B' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {amt / 1000000}M
                  </button>
                );
              })}
            </div>
          </div>

          {/* Thoi gian tich san */}
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t.dca.duration}
            </label>
            <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--brand-primary)', marginBottom: 10, fontFamily: 'monospace' }}>
              {years}Y ({years * 12}M)
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
                      border: isSelected ? 'none' : '1px solid var(--border-subtle)',
                      backgroundColor: isSelected ? 'var(--brand-primary)' : 'transparent',
                      color: isSelected ? '#09090B' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {y}Y
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ty suat sinh loi ky vong */}
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t.dca.roiExpected}
            </label>
            <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--brand-primary)', marginBottom: 10, fontFamily: 'monospace' }}>
              {expectedRoi}% {t.dca.perYear}
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
                      border: isSelected ? 'none' : '1px solid var(--border-subtle)',
                      backgroundColor: isSelected ? 'var(--brand-primary)' : 'transparent',
                      color: isSelected ? '#09090B' : 'var(--text-secondary)',
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
                backgroundColor: 'var(--bg-body)',
                border: '1px solid var(--border-card)',
                borderRadius: 12,
              }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 500 }}>{t.dca.colCapital}</div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                  {formatVND(result.total_deposited)}
                </div>
              </div>

              <div style={{
                padding: 16,
                backgroundColor: 'var(--bg-body)',
                border: '1px solid var(--brand-primary)',
                borderRadius: 12,
              }}>
                <div style={{ fontSize: '12px', color: 'var(--brand-primary)', marginBottom: 4, fontWeight: 500 }}>{t.dca.colFutureValue}</div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--brand-primary)', fontFamily: 'monospace' }}>
                  {formatVND(result.final_asset_value)}
                </div>
              </div>

              <div style={{
                padding: 16,
                backgroundColor: 'var(--bg-body)',
                border: '1px solid var(--border-card)',
                borderRadius: 12,
              }}>
                <div style={{ fontSize: '12px', color: '#10B981', marginBottom: 4, fontWeight: 500 }}>{t.dca.colGains}</div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#10B981', fontFamily: 'monospace' }}>
                  +{formatVND(result.final_compound_gain)}
                </div>
              </div>

              <div style={{
                padding: 16,
                backgroundColor: 'var(--bg-body)',
                border: '1px solid var(--border-card)',
                borderRadius: 12,
              }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 500 }}>{t.dca.colSavings}</div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--brand-primary)', fontFamily: 'monospace' }}>
                  +{formatVND(result.outperformance)}
                </div>
              </div>
            </div>

            {/* Bang tien trinh qua tung nam */}
            <div style={{
              overflowX: 'auto',
              border: '1px solid var(--border-card)',
              borderRadius: 8,
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-body)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '12px' }}>{t.dca.colMilestone}</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '12px' }}>{t.dca.colCapital}</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '12px' }}>{t.dca.colFutureValue}</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '12px' }}>{t.dca.colGains}</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '12px' }}>{t.dca.colSavings}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.yearly_points.slice(1).map((pt) => (
                    <tr
                      key={pt.year}
                      style={{
                        borderBottom: '1px solid var(--border-card)',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {t.dca.yearN.replace('{year}', String(pt.year))}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{formatVND(pt.total_deposited)}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--brand-primary)', fontFamily: 'monospace' }}>
                        {formatVND(pt.portfolio_value)}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#10B981', fontWeight: 500, fontFamily: 'monospace' }}>
                        +{formatVND(pt.compound_profit)}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
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
