import React, { useEffect, useState, useMemo } from 'react';
import type { PortfolioSummary, DividendEvent, PortfolioAnalytics } from '../types';
import { fetchDividendCalendar, fetchPortfolioAnalytics } from '../services/api';
import { PortfolioAnalyticsCard } from './PortfolioAnalyticsCard';
import { DCACalculatorModal } from './DCACalculatorModal';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Trash2,
  RotateCcw,
  Calendar,
  FileSpreadsheet,
  PlusCircle,
  Lock,
  LogIn,
  UserPlus,
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
  const { user, isGuest, openAuthModal } = useAuth();
  const [dividendEvents, setDividendEvents] = useState<DividendEvent[]>([]);
  const [analytics, setAnalytics] = useState<PortfolioAnalytics | null>(null);
  const [isDCAModalOpen, setIsDCAModalOpen] = useState<boolean>(false);
  const [assetFilter, setAssetFilter] = useState<'ALL' | 'GOLD' | 'STOCK_VN' | 'STOCK_US' | 'CRYPTO'>('ALL');

  const { formatMoney, currency, usdVndRate } = useCurrency();
  const { t } = useLanguage();
  const formatVND = (num: number) => formatMoney(num);

  const handleAddClick = () => {
    if (isGuest) {
      openAuthModal('login');
    } else {
      onOpenAddModal();
    }
  };

  const handleDeleteClick = (id: string) => {
    if (isGuest) {
      openAuthModal('login');
    } else {
      onDeleteTransaction(id);
    }
  };

  const handleResetClick = () => {
    if (isGuest) {
      openAuthModal('login');
    } else {
      onResetPortfolio();
    }
  };

  useEffect(() => {
    fetchDividendCalendar()
      .then((events) => setDividendEvents(events))
      .catch((err) => console.error('Dividend calendar error:', err));

    fetchPortfolioAnalytics()
      .then((data) => setAnalytics(data))
      .catch((err) => console.error('Portfolio analytics error:', err));
  }, [portfolio]);

  // Filtered holdings (Hook unconditionally before any early returns)
  const filteredHoldings = useMemo(() => {
    if (!portfolio || !portfolio.holdings) return [];
    if (assetFilter === 'ALL') return portfolio.holdings;
    return portfolio.holdings.filter((h) => {
      if (assetFilter === 'GOLD') return h.asset_id.includes('XAU');
      if (assetFilter === 'STOCK_VN') return h.asset_id.startsWith('VN-');
      if (assetFilter === 'STOCK_US') return h.asset_id.startsWith('US-');
      if (assetFilter === 'CRYPTO') return h.asset_id.startsWith('CRYPTO-');
      return true;
    });
  }, [portfolio, assetFilter]);

  if (!portfolio) {
    return (
      <div style={{
        padding: 60,
        textAlign: 'center',
        backgroundColor: '#18181B',
        border: '1px solid #27272A',
        borderRadius: 12,
      }}>
        <div className="pulse-dot" style={{ backgroundColor: '#00E5FF', margin: '0 auto 16px auto', display: 'block' }} />
        <p style={{ color: '#FAFAFA', fontSize: '15px', fontWeight: 500 }}>Đang tải dữ liệu danh mục đầu tư...</p>
        <p style={{ color: '#A1A1AA', fontSize: '13px', marginTop: 4 }}>Đồng bộ thời gian thực từ sổ cái Go Backend</p>
      </div>
    );
  }

  const isProfitable = portfolio.total_unrealized_pnl >= 0;

  // Asset icon & branding helper
  const getAssetMeta = (symbol: string, assetId: string) => {
    if (assetId.includes('XAU')) {
      return {
        icon: '🪙',
        bg: 'rgba(245, 158, 11, 0.15)',
        border: 'rgba(245, 158, 11, 0.35)',
        badge: 'VÀNG 9999',
        badgeColor: '#F59E0B',
      };
    }
    if (symbol === 'FPT') {
      return {
        icon: '💻',
        bg: 'rgba(59, 130, 246, 0.15)',
        border: 'rgba(59, 130, 246, 0.35)',
        badge: 'VN-HOSE',
        badgeColor: '#3B82F6',
      };
    }
    if (symbol === 'HPG') {
      return {
        icon: '🏭',
        bg: 'rgba(168, 85, 247, 0.15)',
        border: 'rgba(168, 85, 247, 0.35)',
        badge: 'VN-HOSE',
        badgeColor: '#A855F7',
      };
    }
    if (symbol === 'TCB') {
      return {
        icon: '🏦',
        bg: 'rgba(16, 185, 129, 0.15)',
        border: 'rgba(16, 185, 129, 0.35)',
        badge: 'VN-HOSE',
        badgeColor: '#10B981',
      };
    }
    if (symbol === 'NVDA') {
      return {
        icon: '⚡',
        bg: 'rgba(0, 229, 255, 0.15)',
        border: 'rgba(0, 229, 255, 0.35)',
        badge: 'US-TECH',
        badgeColor: '#00E5FF',
      };
    }
    if (symbol === 'BTC') {
      return {
        icon: '₿',
        bg: 'rgba(249, 115, 22, 0.15)',
        border: 'rgba(249, 115, 22, 0.35)',
        badge: 'CRYPTO',
        badgeColor: '#F97316',
      };
    }
    if (symbol === 'ETH') {
      return {
        icon: '🔷',
        bg: 'rgba(99, 102, 241, 0.15)',
        border: 'rgba(99, 102, 241, 0.35)',
        badge: 'CRYPTO',
        badgeColor: '#6366F1',
      };
    }
    return {
      icon: '📊',
      bg: 'rgba(113, 113, 122, 0.15)',
      border: 'rgba(113, 113, 122, 0.35)',
      badge: 'ASSET',
      badgeColor: '#A1A1AA',
    };
  };

  // Xuất file CSV danh mục
  const handleExportCSV = () => {
    let csvContent = '\uFEFF';
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
      {/* 0. GUEST VIEW / PERSONAL PORTFOLIO BANNER */}
      {isGuest ? (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: 12,
            backgroundColor: 'rgba(0, 229, 255, 0.05)',
            border: '1px solid rgba(0, 229, 255, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: 'rgba(0, 229, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00E5FF',
                flexShrink: 0,
              }}
            >
              <Lock size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#FAFAFA' }}>
                  Chế Độ Xem Khách (Chỉ Xem)
                </h4>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: 'rgba(0, 229, 255, 0.15)',
                    color: '#00E5FF',
                    padding: '1px 6px',
                    borderRadius: 4,
                  }}
                >
                  DEMO VIEW
                </span>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#A1A1AA' }}>
                Đăng nhập hoặc đăng ký tài khoản để quản lý sổ cái riêng, lưu trữ giao dịch cá nhân và nhận thông báo cảnh báo giá.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => openAuthModal('login')}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                backgroundColor: '#00E5FF',
                color: '#09090B',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <LogIn size={14} />
              <span>Đăng Nhập</span>
            </button>
            <button
              onClick={() => openAuthModal('register')}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                backgroundColor: 'transparent',
                border: '1px solid #3F3F46',
                color: '#FAFAFA',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <UserPlus size={14} />
              <span>Tạo Tài Khoản</span>
            </button>
          </div>
        </div>
      ) : user && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: 10,
            backgroundColor: '#18181B',
            border: '1px solid #27272A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: user.role === 'admin' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 229, 255, 0.15)',
                color: user.role === 'admin' ? '#EF4444' : '#00E5FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              {user.username.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#FAFAFA', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>Sổ cái của {user.full_name || user.username}</span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '1px 6px',
                    borderRadius: 4,
                    backgroundColor: user.role === 'admin' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 229, 255, 0.1)',
                    color: user.role === 'admin' ? '#EF4444' : '#00E5FF',
                    textTransform: 'uppercase',
                  }}
                >
                  {user.role}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#71717A' }}>
                Dữ liệu sổ cái được bảo mật và phân lập riêng cho tài khoản của bạn
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. EXECUTIVE BALANCE HERO (Bloomberg / Coinbase Pro Style) */}
      <div style={{
        backgroundColor: '#18181B',
        border: '1px solid #27272A',
        borderRadius: 12,
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 24px -1px rgba(0, 0, 0, 0.4)',
      }}>
        {/* Subtle top cyan line highlight */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '5%',
          right: '5%',
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.5), transparent)',
        }} />

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24,
          alignItems: 'center',
          marginBottom: 20,
        }}>
          {/* Main Net Worth Display */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#10B981',
                boxShadow: '0 0 8px #10B981',
                display: 'inline-block',
              }} />
              <span style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#A1A1AA',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                {t.portfolio.totalValue.toUpperCase()}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
              <span className="num-mono" style={{
                fontSize: '38px',
                fontWeight: 700,
                color: '#FAFAFA',
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
              }}>
                {formatVND(portfolio.total_net_worth)}
              </span>

              {/* 24h P&L chip */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 10px',
                borderRadius: 6,
                backgroundColor: isProfitable ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: isProfitable ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                color: isProfitable ? '#10B981' : '#EF4444',
                fontSize: '13px',
                fontWeight: 600,
              }}>
                {isProfitable ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                <span>{isProfitable ? '+' : ''}{portfolio.total_pnl_rate.toFixed(2)}%</span>
                <span style={{ color: '#A1A1AA', fontSize: '11px', fontWeight: 400 }}>({formatVND(portfolio.total_unrealized_pnl)})</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8, fontSize: '13px', color: '#A1A1AA' }}>
              <span>{t.portfolio.totalCost}: <strong style={{ color: '#FAFAFA', fontFamily: 'monospace' }}>{formatVND(portfolio.total_cost_basis)}</strong></span>
              <span>•</span>
              <span>Cập nhật: <strong style={{ color: '#00E5FF' }}>Vừa xong</strong></span>
            </div>
          </div>

          {/* Quick Metrics & Actions Block */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {/* Metric 1: Unrealized P&L */}
              <div style={{
                backgroundColor: '#09090B',
                border: '1px solid #27272A',
                borderRadius: 8,
                padding: '12px 14px',
              }}>
                <div style={{ fontSize: '11px', color: '#A1A1AA', fontWeight: 600, textTransform: 'uppercase' }}>
                  {t.portfolio.unrealizedPnL.toUpperCase()}
                </div>
                <div className="num-mono" style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: isProfitable ? '#10B981' : '#EF4444',
                  marginTop: 4,
                }}>
                  {isProfitable ? '+' : ''}{formatVND(portfolio.total_unrealized_pnl)}
                </div>
              </div>

              {/* Metric 2: Dividends */}
              <div style={{
                backgroundColor: '#09090B',
                border: '1px solid #27272A',
                borderRadius: 8,
                padding: '12px 14px',
              }}>
                <div style={{ fontSize: '11px', color: '#A1A1AA', fontWeight: 600, textTransform: 'uppercase' }}>
                  {t.portfolio.dividendUpcoming.toUpperCase()}
                </div>
                <div className="num-mono" style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#00E5FF',
                  marginTop: 4,
                }}>
                  {formatVND(portfolio.total_dividends)}
                </div>
              </div>

              {/* Metric 3: Yield */}
              <div style={{
                backgroundColor: '#09090B',
                border: '1px solid #27272A',
                borderRadius: 8,
                padding: '12px 14px',
              }}>
                <div style={{ fontSize: '11px', color: '#A1A1AA', fontWeight: 600, textTransform: 'uppercase' }}>
                  {t.portfolio.returnRate.toUpperCase()}
                </div>
                <div className="num-mono" style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#FAFAFA',
                  marginTop: 4,
                }}>
                  {portfolio.estimated_yield.toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Quick Action Button Group */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={handleAddClick}
                style={{
                  backgroundColor: '#00E5FF',
                  color: '#09090B',
                  fontWeight: 600,
                  fontSize: '13px',
                  borderRadius: 8,
                  padding: '9px 18px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
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
                <PlusCircle size={15} />
                <span>{t.header.addTransaction}</span>
              </button>

              <button
                onClick={() => setIsDCAModalOpen(true)}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #3F3F46',
                  color: '#FAFAFA',
                  fontWeight: 500,
                  fontSize: '13px',
                  borderRadius: 8,
                  padding: '9px 16px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#27272A')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <TrendingUp size={14} color="#00E5FF" />
                <span>{t.portfolio.dcaCalculator}</span>
              </button>

              <button
                onClick={handleExportCSV}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #3F3F46',
                  color: '#FAFAFA',
                  fontWeight: 500,
                  fontSize: '13px',
                  borderRadius: 8,
                  padding: '9px 14px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#27272A')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                title="Xuất CSV"
              >
                <FileSpreadsheet size={14} color="#10B981" />
                <span>{t.portfolio.exportCsv}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Multi-asset Allocation Ribbon */}
        <div style={{
          borderTop: '1px solid #27272A',
          paddingTop: 16,
          marginTop: 8,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              PHÂN BỔ DANH MỤC ĐẦU TƯ
            </span>
            <span style={{ fontSize: '12px', color: '#71717A' }}>
              {portfolio.holdings.length} vị thế đang nắm giữ
            </span>
          </div>

          {/* Allocation Bar */}
          <div style={{
            height: 10,
            width: '100%',
            borderRadius: 6,
            overflow: 'hidden',
            display: 'flex',
            backgroundColor: '#09090B',
            border: '1px solid #27272A',
            marginBottom: 12,
          }}>
            {Object.entries(portfolio.asset_allocation).map(([category, pct], idx) => {
              const colors = ['#F59E0B', '#3B82F6', '#00E5FF', '#F97316', '#10B981', '#A1A1AA'];
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

          {/* Allocation Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {Object.entries(portfolio.asset_allocation).map(([category, pct], idx) => {
              const colors = ['#F59E0B', '#3B82F6', '#00E5FF', '#F97316', '#10B981', '#A1A1AA'];
              return (
                <div key={category} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: colors[idx % colors.length] }} />
                  <span style={{ color: '#A1A1AA' }}>{category}:</span>
                  <span className="num-mono" style={{ fontWeight: 600, color: '#FAFAFA' }}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. PORTFOLIO HEALTH ANALYTICS & AI INSIGHTS CARD */}
      <PortfolioAnalyticsCard
        analytics={analytics}
        onOpenDCAModal={() => setIsDCAModalOpen(true)}
      />

      {/* 3. HOLDINGS TABLE (Terminal Class) */}
      <div style={{
        backgroundColor: '#18181B',
        border: '1px solid #27272A',
        borderRadius: 12,
        padding: 24,
      }}>
        {/* Header & Filter Controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#FAFAFA', margin: 0 }}>
                Chi Tiết Các Vị Thế Nắm Giữ (Holdings)
              </h3>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#00E5FF',
                backgroundColor: 'rgba(0, 229, 255, 0.1)',
                border: '1px solid rgba(0, 229, 255, 0.25)',
                padding: '2px 8px',
                borderRadius: 4,
              }}>
                {filteredHoldings.length} Mã
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#A1A1AA', margin: '4px 0 0 0' }}>
              Theo dõi biến động thị trường, giá vốn DCA và tỷ trọng danh mục thực tế
            </p>
          </div>

          {/* Segmented Filter Pills */}
          <div style={{
            display: 'flex',
            backgroundColor: '#09090B',
            border: '1px solid #27272A',
            borderRadius: 8,
            padding: 3,
            gap: 2,
          }}>
            {[
              { id: 'ALL', label: t.portfolio.filterAll },
              { id: 'GOLD', label: `🪙 ${t.portfolio.filterGold}` },
              { id: 'STOCK_VN', label: `🏢 ${t.portfolio.filterStockVn}` },
              { id: 'STOCK_US', label: `🌐 ${t.portfolio.filterStockUs}` },
              { id: 'CRYPTO', label: `₿ ${t.portfolio.filterCrypto}` },
            ].map((f) => {
              const isActive = assetFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setAssetFilter(f.id as any)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 6,
                    fontSize: '12px',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#FAFAFA' : '#A1A1AA',
                    backgroundColor: isActive ? '#27272A' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table Container */}
        <div style={{ overflowX: 'auto', border: '1px solid #27272A', borderRadius: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#09090B', borderBottom: '1px solid #3F3F46' }}>
                <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.portfolio.colAsset}</th>
                <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.portfolio.colQuantity}</th>
                <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.portfolio.colAvgPrice}</th>
                <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.portfolio.colCurrentPrice}</th>
                <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.portfolio.colValue}</th>
                <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.portfolio.colPnL}</th>
                <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.portfolio.dividendUpcoming}</th>
                <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>%</th>
                <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>{t.portfolio.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredHoldings.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px 16px', color: '#A1A1AA' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      <p style={{ margin: 0, fontSize: '14px', color: '#A1A1AA' }}>
                        {t.portfolio.emptyHoldings}
                      </p>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button
                          onClick={handleAddClick}
                          style={{
                            backgroundColor: '#00E5FF',
                            color: '#09090B',
                            fontWeight: 600,
                            fontSize: '13px',
                            borderRadius: 8,
                            padding: '8px 16px',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          + {t.portfolio.addFirstTx}
                        </button>
                        <button
                          onClick={handleResetClick}
                          style={{
                            backgroundColor: 'transparent',
                            border: '1px solid #3F3F46',
                            color: '#FAFAFA',
                            fontWeight: 500,
                            fontSize: '13px',
                            borderRadius: 8,
                            padding: '8px 16px',
                            cursor: 'pointer',
                          }}
                        >
                          ⚡ Nạp Dữ Liệu Mẫu
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredHoldings.map((h) => {
                  const isGain = h.unrealized_pnl >= 0;
                  const isUSD = h.currency === 'USD';
                  const meta = getAssetMeta(h.symbol, h.asset_id);

                  return (
                    <tr
                      key={h.asset_id}
                      style={{
                        borderBottom: '1px solid #27272A',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#27272A')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Asset Column with Rich Badge */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            backgroundColor: meta.bg,
                            border: `1px solid ${meta.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                            flexShrink: 0,
                          }}>
                            {meta.icon}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontWeight: 600, color: '#FAFAFA', fontSize: '14px' }}>
                                {h.symbol}
                              </span>
                              <span style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                color: meta.badgeColor,
                                backgroundColor: meta.bg,
                                border: `1px solid ${meta.border}`,
                                padding: '1px 5px',
                                borderRadius: 4,
                              }}>
                                {meta.badge}
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#A1A1AA', marginTop: 2 }}>
                              {h.name}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Quantity */}
                      <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: '#FAFAFA', fontWeight: 600 }}>
                        {h.total_quantity.toLocaleString()} <span style={{ fontSize: '11px', color: '#71717A', fontWeight: 400 }}>{h.asset_id.includes('XAU') ? 'lượng' : h.asset_id.includes('CRYPTO') ? 'Coin' : 'CP'}</span>
                      </td>

                      {/* Cost basis DCA */}
                      <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: '#A1A1AA' }}>
                        {isUSD ? `$${h.avg_buy_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : formatVND(h.avg_buy_price)}
                      </td>

                      {/* Current Price */}
                      <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontWeight: 600, color: '#FAFAFA' }}>
                        {isUSD ? (
                          <div>
                            <div>${h.current_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                            {currency === 'VND' && (
                              <div style={{ fontSize: '11px', color: '#71717A', fontWeight: 400 }}>
                                ≈ {Math.round(h.current_price * usdVndRate).toLocaleString('vi-VN')} ₫
                              </div>
                            )}
                          </div>
                        ) : (
                          formatVND(h.current_price)
                        )}
                      </td>

                      {/* Total Market Value */}
                      <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontWeight: 600, color: '#00E5FF' }}>
                        {isUSD ? (
                          <div>
                            <div>${h.current_value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                            {currency === 'VND' && (
                              <div style={{ fontSize: '11px', color: '#71717A', fontWeight: 400 }}>
                                ≈ {Math.round(h.current_value * usdVndRate).toLocaleString('vi-VN')} ₫
                              </div>
                            )}
                          </div>
                        ) : (
                          formatVND(h.current_value)
                        )}
                      </td>

                      {/* PnL with Glowing Badge */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: '12px',
                            fontWeight: 600,
                            fontFamily: 'monospace',
                            backgroundColor: isGain ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                            border: isGain ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                            color: isGain ? '#10B981' : '#EF4444',
                            width: 'fit-content',
                          }}>
                            {isGain ? '▲ +' : '▼ '}{h.unrealized_pnl_rate.toFixed(2)}%
                          </span>
                          <span style={{ fontSize: '11px', color: '#A1A1AA', fontFamily: 'monospace' }}>
                            {isGain ? '+' : ''}{isUSD ? (
                              <span>
                                ${h.unrealized_pnl.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                {currency === 'VND' && ` (≈ ${Math.round(h.unrealized_pnl * usdVndRate).toLocaleString('vi-VN')} ₫)`}
                              </span>
                            ) : formatVND(h.unrealized_pnl)}
                          </span>
                        </div>
                      </td>

                      {/* Dividends */}
                      <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: '#10B981', fontWeight: 500 }}>
                        {h.dividends_collected > 0 ? (isUSD ? `$${h.dividends_collected}` : formatVND(h.dividends_collected)) : '—'}
                      </td>

                      {/* Portfolio Weight & Mini Progress */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, width: 90 }}>
                          <span className="num-mono" style={{ fontWeight: 600, color: '#FAFAFA', fontSize: '12px' }}>
                            {h.portfolio_weight}%
                          </span>
                          <div style={{
                            width: '100%',
                            height: 4,
                            backgroundColor: '#09090B',
                            borderRadius: 2,
                            overflow: 'hidden',
                          }}>
                            <div style={{
                              width: `${Math.min(100, h.portfolio_weight)}%`,
                              height: '100%',
                              backgroundColor: meta.badgeColor,
                            }} />
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <button
                          onClick={() => onSelectAsset(h.asset_id)}
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. DIVIDEND SCHEDULE CALENDAR */}
      <div style={{
        backgroundColor: '#18181B',
        border: '1px solid #27272A',
        borderRadius: 12,
        padding: 24,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Calendar size={18} color="#00E5FF" />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#FAFAFA', margin: 0 }}>
              Lịch Nhận Cổ Tức & Ước Tính Dòng Tiền Dự Kiến
            </h3>
          </div>
          <span style={{ fontSize: '13px', color: '#A1A1AA' }}>
            Tự động tính toán theo số lượng tài sản sở hữu thực tế
          </span>
        </div>

        <div style={{ overflowX: 'auto', border: '1px solid #27272A', borderRadius: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#09090B', borderBottom: '1px solid #3F3F46' }}>
                <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>MÃ CK</th>
                <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SỰ KIỆN DOANH NGHIỆP</th>
                <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>NGÀY GDKHQ</th>
                <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>NGÀY THANH TOÁN</th>
                <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CỔ TỨC / CP</th>
                <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TỶ SUẤT</th>
                <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>DÒNG TIỀN DỰ KIẾN</th>
              </tr>
            </thead>
            <tbody>
              {dividendEvents.map((ev) => (
                <tr
                  key={ev.id}
                  style={{ borderBottom: '1px solid #27272A', transition: 'background-color 0.15s ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#27272A')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#00E5FF' }}>{ev.symbol}</td>
                  <td style={{ padding: '12px 16px', color: '#FAFAFA' }}>{ev.name}</td>
                  <td style={{ padding: '12px 16px', color: '#A1A1AA', fontFamily: 'monospace' }}>{ev.ex_date}</td>
                  <td style={{ padding: '12px 16px', color: '#10B981', fontFamily: 'monospace', fontWeight: 500 }}>{ev.pay_date}</td>
                  <td style={{ padding: '12px 16px', color: '#FAFAFA', fontFamily: 'monospace' }}>
                    {ev.asset_id.includes('US') ? `$${ev.dividend_amount}` : `${ev.dividend_amount.toLocaleString()} VND`}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: 4,
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      color: '#10B981',
                      fontFamily: 'monospace',
                    }}>
                      {ev.yield_pct}%
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: ev.estimated_cash > 0 ? '#00E5FF' : '#71717A', fontFamily: 'monospace' }}>
                    {ev.estimated_cash > 0 ? (ev.asset_id.includes('US') ? `$${ev.estimated_cash.toLocaleString()}` : formatVND(ev.estimated_cash)) : 'Chưa có vị thế'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. TRANSACTION HISTORY LEDGER */}
      <div style={{
        backgroundColor: '#18181B',
        border: '1px solid #27272A',
        borderRadius: 12,
        padding: 24,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#FAFAFA', margin: 0 }}>
            Lịch Sử Sổ Giao Dịch
          </h3>
          <button
            onClick={handleResetClick}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '12px',
              fontWeight: 500,
              padding: '6px 12px',
              backgroundColor: 'transparent',
              border: '1px solid #3F3F46',
              borderRadius: 8,
              color: '#A1A1AA',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#27272A')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            title="Khôi phục về danh mục demo mẫu"
          >
            <RotateCcw size={13} /> Phục hồi dữ liệu mẫu
          </button>
        </div>

        <div style={{ overflowX: 'auto', border: '1px solid #27272A', borderRadius: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#09090B', borderBottom: '1px solid #3F3F46' }}>
                <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>THỜI GIAN</th>
                <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>LOẠI</th>
                <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>MÃ</th>
                <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>KHỐI LƯỢNG</th>
                <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>GIÁ KHỚP</th>
                <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TỔNG GIÁ TRỊ</th>
                <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>GHI CHÚ</th>
                <th style={{ padding: '12px 16px', color: '#A1A1AA', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>XÓA</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.recent_transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '32px 16px', color: '#A1A1AA', fontSize: '13px' }}>
                    Chưa có lịch sử giao dịch nào trong sổ cái.
                  </td>
                </tr>
              ) : (
                portfolio.recent_transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    style={{ borderBottom: '1px solid #27272A', transition: 'background-color 0.15s ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#27272A')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: '#A1A1AA', fontFamily: 'monospace' }}>
                      {new Date(tx.transaction_date).toLocaleDateString('vi-VN')}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: 4,
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: tx.type === 'BUY' ? 'rgba(0, 229, 255, 0.12)' : tx.type === 'DIVIDEND' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        border: tx.type === 'BUY' ? '1px solid rgba(0, 229, 255, 0.3)' : tx.type === 'DIVIDEND' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                        color: tx.type === 'BUY' ? '#00E5FF' : tx.type === 'DIVIDEND' ? '#10B981' : '#EF4444',
                      }}>
                        {tx.type === 'BUY' ? 'MUA' : tx.type === 'DIVIDEND' ? 'CỔ TỨC' : 'BÁN'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#FAFAFA' }}>{tx.asset_symbol}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#FAFAFA' }}>{tx.quantity.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#FAFAFA' }}>{tx.price.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 600, color: '#00E5FF' }}>
                      {tx.total_amount.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: '#A1A1AA' }}>{tx.notes || '—'}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleDeleteClick(tx.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#A1A1AA',
                          cursor: 'pointer',
                          padding: 4,
                          transition: 'color 0.2s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#A1A1AA')}
                        title="Xoá giao dịch"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. MODAL DCA */}
      <DCACalculatorModal
        isOpen={isDCAModalOpen}
        onClose={() => setIsDCAModalOpen(false)}
      />
    </div>
  );
};
