import React from 'react';
import type { PortfolioAnalytics } from '../types';
import { ShieldCheck, AlertTriangle, Lightbulb, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';

interface PortfolioAnalyticsCardProps {
  analytics: PortfolioAnalytics | null;
  onOpenDCAModal: () => void;
}

export const PortfolioAnalyticsCard: React.FC<PortfolioAnalyticsCardProps> = ({
  analytics,
  onOpenDCAModal,
}) => {
  if (!analytics) return null;

  const score = analytics.health_score;
  const scoreColor = score >= 80 ? '#10B981' : score >= 65 ? '#00E5FF' : '#EF4444';

  // SVG Gauge calculation (circumference for radius 38)
  const radius = 38;
  const circumference = 2 * Math.PI * radius; // ~238.76
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div style={{
      backgroundColor: '#18181B',
      border: '1px solid #27272A',
      borderRadius: 12,
      padding: 24,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle top cyan line highlight */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '10%',
        right: '10%',
        height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.4), transparent)',
      }} />

      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
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
            boxShadow: '0 0 12px rgba(0, 229, 255, 0.15)',
          }}>
            <Sparkles size={18} color="#00E5FF" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#FAFAFA', margin: 0 }}>
                Đánh Giá Sức Khỏe Danh Mục & Khuyến Nghị AI
              </h3>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                padding: '2px 8px',
                borderRadius: 4,
              }}>
                HHI & Sharpe
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#A1A1AA', margin: '3px 0 0 0' }}>
              Phân tích định lượng mức độ phân tán rủi ro và khuyến nghị tái cân bằng tự động
            </p>
          </div>
        </div>

        <button
          onClick={onOpenDCAModal}
          style={{
            backgroundColor: '#00E5FF',
            color: '#09090B',
            fontWeight: 600,
            fontSize: '13px',
            borderRadius: 8,
            padding: '9px 18px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.2s ease',
            boxShadow: '0 0 16px rgba(0, 229, 255, 0.2)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#00B8CC';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#00E5FF';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <TrendingUp size={15} />
          <span>Kế Hoạch Tích Sản Lãi Kép (DCA)</span>
        </button>
      </div>

      {/* Grid 3 Stat Highlights with Circular HUD Gauge */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}>
        {/* Modern Circular Progress Health Meter */}
        <div style={{
          backgroundColor: '#09090B',
          borderRadius: 8,
          padding: '16px 20px',
          border: '1px solid #3F3F46',
          display: 'flex',
          alignItems: 'center',
          gap: 18,
        }}>
          {/* SVG Gauge */}
          <div style={{ position: 'relative', width: 84, height: 84, flexShrink: 0 }}>
            <svg width="84" height="84" viewBox="0 0 92 92" style={{ transform: 'rotate(-90deg)' }}>
              {/* Background Track */}
              <circle
                cx="46"
                cy="46"
                r={radius}
                stroke="#27272A"
                strokeWidth="7"
                fill="none"
              />
              {/* Progress Ring */}
              <circle
                cx="46"
                cy="46"
                r={radius}
                stroke={scoreColor}
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ fontSize: '20px', fontWeight: 700, color: '#FAFAFA', fontFamily: 'monospace', lineHeight: 1 }}>
                {score}
              </span>
              <span style={{ fontSize: '10px', color: '#71717A', fontWeight: 500, marginTop: 2 }}>/100</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#A1A1AA', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ĐIỂM SỨC KHỎE
            </div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: scoreColor, marginTop: 4 }}>
              {score >= 80 ? 'Rất lành mạnh' : score >= 60 ? 'Tương đối tốt' : 'Cần tối ưu tỷ trọng'}
            </div>
            <div style={{ fontSize: '12px', color: '#71717A', marginTop: 2 }}>
              Đo lường rủi ro tập trung vốn
            </div>
          </div>
        </div>

        {/* Khau vi rui ro */}
        <div style={{
          backgroundColor: '#09090B',
          borderRadius: 8,
          padding: '16px 20px',
          border: '1px solid #3F3F46',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: '11px', color: '#A1A1AA', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              KHẨU VỊ RỦI RO
            </span>
            <span style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: 4,
              backgroundColor: 'rgba(0, 229, 255, 0.1)',
              border: '1px solid rgba(0, 229, 255, 0.25)',
              color: '#00E5FF',
              fontWeight: 600,
            }}>
              {analytics.diversification_grade}
            </span>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#FAFAFA' }}>
            {analytics.risk_profile}
          </div>
          <div style={{ fontSize: '12px', color: '#71717A', marginTop: 4 }}>
            Chỉ số tập trung tài sản HHI tối ưu
          </div>
        </div>

        {/* Sharpe Ratio */}
        <div style={{
          backgroundColor: '#09090B',
          borderRadius: 8,
          padding: '16px 20px',
          border: '1px solid #3F3F46',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
          <div style={{ fontSize: '11px', color: '#A1A1AA', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
            SHARPE RATIO ƯỚC TÍNH
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: '24px', fontWeight: 600, color: '#00E5FF', fontFamily: 'monospace' }}>
              {analytics.estimated_sharpe_ratio}
            </span>
            <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 500 }}>
              (Vượt chuẩn &gt; 1.5)
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#71717A', marginTop: 4 }}>
            Tỷ suất bù đắp rủi ro so với lãi suất phi rủi ro
          </div>
        </div>
      </div>

      {/* 2 Cot: Diem Manh & Khuyen Nghi Rebalancing */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 16,
      }}>
        {/* Cot 1: Diem Manh & Luu Y */}
        <div style={{
          backgroundColor: '#09090B',
          borderRadius: 8,
          padding: 20,
          border: '1px solid #3F3F46',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', fontWeight: 600, color: '#10B981', marginBottom: 14 }}>
            <ShieldCheck size={16} />
            <span>Điểm Mạnh Danh Mục</span>
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10, fontSize: '13px', color: '#A1A1AA' }}>
            {analytics.strength_points?.map((pt, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <CheckCircle2 size={15} color="#10B981" style={{ marginTop: 2, flexShrink: 0 }} />
                <span style={{ color: '#FAFAFA' }}>{pt}</span>
              </li>
            ))}
          </ul>

          {analytics.risk_warnings?.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', fontWeight: 600, color: '#EF4444', marginTop: 18, marginBottom: 10 }}>
                <AlertTriangle size={15} />
                <span>Điểm Cần Lưu Ý</span>
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: '13px', color: '#A1A1AA' }}>
                {analytics.risk_warnings.map((w, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ color: '#EF4444', fontWeight: 700 }}>•</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Cot 2: Khuyen Nghi Tai Can Bang */}
        <div style={{
          backgroundColor: '#09090B',
          borderRadius: 8,
          padding: 20,
          border: '1px solid #3F3F46',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', fontWeight: 600, color: '#00E5FF', marginBottom: 14 }}>
            <Lightbulb size={16} />
            <span>Khuyến Nghị Hành Động (AI Rebalancing)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {analytics.rebalance_tips?.map((tip, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: '#18181B',
                  border: '1px solid #27272A',
                  borderRadius: 8,
                  padding: '12px 14px',
                  fontSize: '13px',
                  color: '#FAFAFA',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  transition: 'border-color 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#3F3F46')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#27272A')}
              >
                <span style={{
                  color: '#00E5FF',
                  fontWeight: 700,
                  fontSize: '11px',
                  backgroundColor: 'rgba(0, 229, 255, 0.1)',
                  padding: '2px 6px',
                  borderRadius: 4,
                  flexShrink: 0,
                  marginTop: 1,
                }}>
                  TIP #{i + 1}
                </span>
                <span style={{ color: '#FAFAFA', lineHeight: 1.4 }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
