import React from 'react';
import type { PortfolioAnalytics } from '../types';
import { ShieldCheck, AlertTriangle, Lightbulb, Activity, CheckCircle2 } from 'lucide-react';

interface PortfolioAnalyticsCardProps {
  analytics: PortfolioAnalytics | null;
  onOpenDCAModal: () => void;
}

export const PortfolioAnalyticsCard: React.FC<PortfolioAnalyticsCardProps> = ({
  analytics,
  onOpenDCAModal,
}) => {
  if (!analytics) return null;

  const scoreColor =
    analytics.health_score >= 80 ? 'var(--accent-green)' : analytics.health_score >= 65 ? 'var(--accent-gold)' : 'var(--accent-red)';

  return (
    <div className="glass-panel" style={{ padding: 24, background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={20} color="#818cf8" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Đánh Giá Sức Khỏe Danh Mục & Khuyến Nghị AI</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
              Phân tích chỉ số đa dạng hóa HHI, Sharpe Ratio và mức độ chịu rủi ro
            </p>
          </div>
        </div>

        <button
          onClick={onOpenDCAModal}
          className="btn-primary"
          style={{ padding: '8px 14px', fontSize: '0.82rem' }}
        >
          📈 Kế Hoạch Tích Sản Lãi Kép (DCA)
        </button>
      </div>

      {/* Grid điểm số & hồ sơ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 14,
        marginBottom: 20,
      }}>
        {/* Điểm sức khỏe */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: 12,
          padding: 16,
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700 }}>ĐIỂM SỨC KHỎE</div>
            <div className="num-mono" style={{ fontSize: '2.2rem', fontWeight: 900, color: scoreColor, lineHeight: 1 }}>
              {analytics.health_score}
              <span style={{ fontSize: '1rem', color: 'var(--text-dim)', fontWeight: 500 }}>/100</span>
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {analytics.health_score >= 80 ? 'Danh mục rất lành mạnh' : 'Cần tối ưu tỷ trọng'}
          </div>
        </div>

        {/* Khẩu vị rủi ro */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: 12,
          padding: 16,
          border: '1px solid var(--border-subtle)',
        }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700, marginBottom: 4 }}>
            KHẨU VỊ RỦI RO
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
            {analytics.risk_profile}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 4 }}>
            Độ phân tán: {analytics.diversification_grade}
          </div>
        </div>

        {/* Sharpe Ratio */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: 12,
          padding: 16,
          border: '1px solid var(--border-subtle)',
        }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700, marginBottom: 4 }}>
            SHARPE RATIO ƯỚC TÍNH
          </div>
          <div className="num-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-purple)' }}>
            {analytics.estimated_sharpe_ratio}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 2 }}>
            Hiệu suất bù trừ rủi ro vượt trội (&gt;1.5)
          </div>
        </div>
      </div>

      {/* 2 Cột: Điểm Mạnh & Khuyến Nghị Tái Cân Bằng */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 16,
      }}>
        {/* Điểm mạnh & Rủi ro */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 12,
          padding: 16,
          border: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-green)', marginBottom: 12 }}>
            <ShieldCheck size={16} /> Điểm Mạnh Danh Mục
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {analytics.strength_points?.map((pt, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <CheckCircle2 size={14} color="var(--accent-green)" style={{ marginTop: 2, flexShrink: 0 }} />
                <span>{pt}</span>
              </li>
            ))}
          </ul>

          {analytics.risk_warnings?.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-gold)', marginTop: 14, marginBottom: 8 }}>
                <AlertTriangle size={15} /> Điểm Cần Lưu Ý
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                {analytics.risk_warnings.map((w, i) => (
                  <li key={i}>⚠️ {w}</li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Khuyến nghị tái cân bằng */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 12,
          padding: 16,
          border: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-gold)', marginBottom: 12 }}>
            <Lightbulb size={16} /> Khuyến Nghị Hành Động (Rebalancing)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {analytics.rebalance_tips?.map((tip, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(245, 158, 11, 0.06)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontSize: '0.82rem',
                  color: 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                }}
              >
                <span style={{ color: 'var(--accent-gold)', fontWeight: 800 }}>#{i + 1}</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
