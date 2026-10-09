import React from 'react';
import type { PortfolioAnalytics } from '../types';
import { useLanguage } from '../context/useLanguage';
import { ShieldCheck, AlertTriangle, Lightbulb, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';

interface PortfolioAnalyticsCardProps {
  analytics: PortfolioAnalytics | null;
  onOpenDCAModal: () => void;
}

export const PortfolioAnalyticsCard: React.FC<PortfolioAnalyticsCardProps> = ({
  analytics,
  onOpenDCAModal,
}) => {
  const { t } = useLanguage();

  if (!analytics) return null;

  const score = analytics.health_score;
  const scoreColor = score >= 80 ? '#10B981' : score >= 65 ? 'var(--brand-primary)' : '#EF4444';

  // SVG Gauge calculation (circumference for radius 38)
  const radius = 38;
  const circumference = 2 * Math.PI * radius; // ~238.76
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border-card)',
      borderRadius: 12,
      padding: 24,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle top brand line highlight */}
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
            backgroundColor: 'var(--bg-surface-hover)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px rgba(0, 229, 255, 0.15)',
          }}>
            <Sparkles size={18} color="var(--brand-primary)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                {t.portfolio.analyticsTitle}
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
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '3px 0 0 0' }}>
              {t.analytics.title}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenDCAModal}
          style={{
            backgroundColor: 'var(--brand-primary)',
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
            e.currentTarget.style.backgroundColor = 'var(--brand-hover)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--brand-primary)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <TrendingUp size={15} />
          <span>{t.portfolio.dcaCalculator}</span>
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
          backgroundColor: 'var(--bg-body)',
          borderRadius: 8,
          padding: '16px 20px',
          border: '1px solid var(--border-subtle)',
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
                stroke="var(--border-card)"
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
              <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace', lineHeight: 1 }}>
                {score}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500, marginTop: 2 }}>/100</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t.analytics.scoreLabel}
            </div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: scoreColor, marginTop: 4 }}>
              {score >= 80 ? t.analytics.scoreVeryHealthy : score >= 60 ? t.analytics.scoreFair : t.analytics.scoreNeedsOptimization}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 2 }}>
              {t.analytics.measureConcentration}
            </div>
          </div>
        </div>

        {/* Khau vi rui ro */}
        <div style={{
          backgroundColor: 'var(--bg-body)',
          borderRadius: 8,
          padding: '16px 20px',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t.analytics.riskAppetite}
            </span>
            <span style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: 4,
              backgroundColor: 'rgba(0, 229, 255, 0.1)',
              border: '1px solid rgba(0, 229, 255, 0.25)',
              color: 'var(--brand-primary)',
              fontWeight: 600,
            }}>
              {analytics.diversification_grade}
            </span>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {analytics.risk_profile}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 4 }}>
            {t.analytics.hhiOptimal}
          </div>
        </div>

        {/* Sharpe Ratio */}
        <div style={{
          backgroundColor: 'var(--bg-body)',
          borderRadius: 8,
          padding: '16px 20px',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
            {t.analytics.estSharpeRatio}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: '24px', fontWeight: 600, color: 'var(--brand-primary)', fontFamily: 'monospace' }}>
              {analytics.estimated_sharpe_ratio}
            </span>
            <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 500 }}>
              {t.analytics.sharpeBenchmark}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 4 }}>
            {t.analytics.riskPremiumDescription}
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
          backgroundColor: 'var(--bg-body)',
          borderRadius: 8,
          padding: 20,
          border: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', fontWeight: 600, color: '#10B981', marginBottom: 14 }}>
            <ShieldCheck size={16} />
            <span>{t.analytics.strengths}</span>
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10, fontSize: '13px', color: 'var(--text-secondary)' }}>
            {analytics.strength_points?.map((pt, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <CheckCircle2 size={15} color="#10B981" style={{ marginTop: 2, flexShrink: 0 }} />
                <span style={{ color: 'var(--text-primary)' }}>{pt}</span>
              </li>
            ))}
          </ul>

          {analytics.risk_warnings?.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', fontWeight: 600, color: '#EF4444', marginTop: 18, marginBottom: 10 }}>
                <AlertTriangle size={15} />
                <span>{t.analytics.cautions}</span>
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: '13px', color: 'var(--text-secondary)' }}>
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
          backgroundColor: 'var(--bg-body)',
          borderRadius: 8,
          padding: 20,
          border: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', fontWeight: 600, color: 'var(--brand-primary)', marginBottom: 14 }}>
            <Lightbulb size={16} />
            <span>{t.analytics.aiRebalancing}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {analytics.rebalance_tips?.map((tip, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-card)',
                  borderRadius: 8,
                  padding: '12px 14px',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  transition: 'border-color 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-card)')}
              >
                <span style={{
                  color: 'var(--brand-primary)',
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
                <span style={{ color: 'var(--text-primary)', lineHeight: 1.4 }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
