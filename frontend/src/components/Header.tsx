import React from 'react';
import { PlusCircle, Search, Smartphone, Monitor, RefreshCw, Bell } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

interface HeaderProps {
  isConnected: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenAddModal: () => void;
  onOpenAlertModal: () => void;
  isMobilePreview: boolean;
  onToggleMobilePreview: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isConnected,
  searchQuery,
  onSearchChange,
  onOpenAddModal,
  onOpenAlertModal,
  isMobilePreview,
  onToggleMobilePreview,
  activeTab,
  onTabChange,
  onRefresh,
}) => {
  const { currency, setCurrency, goldUnit, setGoldUnit } = useCurrency();

  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(7, 10, 19, 0.85)',
      backdropFilter: 'blur(20px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: 1600,
        margin: '0 auto',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
      }}>
        {/* Brand & Connection Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)',
          }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#090d16' }}>Au</span>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #fff 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                FinTracker Pro
              </h1>
              <span style={{
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#818cf8',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 4,
                border: '1px solid rgba(99, 102, 241, 0.3)',
              }}>
                Go Core 1.27
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span
                className="pulse-dot"
                style={{ backgroundColor: isConnected ? 'var(--accent-green)' : 'var(--accent-red)' }}
              />
              <span style={{ fontSize: '0.75rem', color: isConnected ? 'var(--accent-green)' : 'var(--text-dim)', fontWeight: 500 }}>
                {isConnected ? 'Realtime WebSocket Active' : 'Connecting to Go Server...'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Desktop) */}
        <nav className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255, 255, 255, 0.03)', padding: 4, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
          {[
            { id: 'portfolio', label: 'Tài Sản & Lợi Tức' },
            { id: 'market', label: 'Bảng Giá & Vàng SJC' },
            { id: 'chart', label: 'Biểu Đồ Kỹ Thuật' },
            { id: 'forecast', label: 'Dự Đoán Monte Carlo' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: '0.85rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === tab.id ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(79, 70, 229, 0.3) 100%)' : 'transparent',
                color: activeTab === tab.id ? '#fff' : 'var(--text-muted)',
                boxShadow: activeTab === tab.id ? '0 2px 8px rgba(99, 102, 241, 0.25)' : 'none',
                borderBottom: activeTab === tab.id ? '2px solid #818cf8' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Search & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Currency Toggle (VND / USD) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: 3,
            borderRadius: 8,
            border: '1px solid var(--border-subtle)',
          }}>
            <button
              onClick={() => setCurrency('VND')}
              style={{
                padding: '5px 9px',
                fontSize: '0.75rem',
                fontWeight: 700,
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                background: currency === 'VND' ? 'var(--accent-gold)' : 'transparent',
                color: currency === 'VND' ? '#070a13' : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}
              title="Hiển thị tiền tệ: Việt Nam Đồng (VND)"
            >
              ₫ VND
            </button>
            <button
              onClick={() => setCurrency('USD')}
              style={{
                padding: '5px 9px',
                fontSize: '0.75rem',
                fontWeight: 700,
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                background: currency === 'USD' ? 'var(--accent-gold)' : 'transparent',
                color: currency === 'USD' ? '#070a13' : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}
              title="Hiển thị tiền tệ: Đô la Mỹ (USD)"
            >
              $ USD
            </button>
          </div>

          {/* Gold Unit Toggle (Lượng / Chỉ / oz) */}
          <div className="desktop-only" style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: 3,
            borderRadius: 8,
            border: '1px solid var(--border-subtle)',
          }}>
            <button
              onClick={() => setGoldUnit('LUONG')}
              style={{
                padding: '5px 8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                background: goldUnit === 'LUONG' ? 'rgba(99, 102, 241, 0.4)' : 'transparent',
                color: goldUnit === 'LUONG' ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}
              title="1 Lượng (37.5 gram)"
            >
              Lượng
            </button>
            <button
              onClick={() => setGoldUnit('CHI')}
              style={{
                padding: '5px 8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                background: goldUnit === 'CHI' ? 'rgba(99, 102, 241, 0.4)' : 'transparent',
                color: goldUnit === 'CHI' ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}
              title="1 Chỉ = 1/10 Lượng (3.75 gram)"
            >
              Chỉ
            </button>
            <button
              onClick={() => setGoldUnit('OUNCE')}
              style={{
                padding: '5px 8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                background: goldUnit === 'OUNCE' ? 'rgba(99, 102, 241, 0.4)' : 'transparent',
                color: goldUnit === 'OUNCE' ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}
              title="1 Ounce troy quốc tế (oz)"
            >
              oz
            </button>
          </div>

          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}>
            <Search size={15} style={{ position: 'absolute', left: 12, color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="Tìm SJC, FPT, AAPL, BTC..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                padding: '8px 12px 8px 34px',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                outline: 'none',
                width: 190,
                transition: 'all 0.2s',
              }}
            />
          </div>

          <button
            onClick={onRefresh}
            className="btn-ghost"
            title="Làm mới dữ liệu từ Backend"
            style={{ padding: '8px 10px' }}
          >
            <RefreshCw size={15} />
          </button>

          <button
            onClick={onOpenAlertModal}
            className="btn-ghost"
            title="Cài đặt cảnh báo giá tự động"
            style={{ padding: '8px 12px', color: 'var(--accent-gold)' }}
          >
            <Bell size={15} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Cảnh Báo</span>
          </button>

          {/* Toggle Mobile Simulator Preview */}
          <button
            onClick={onToggleMobilePreview}
            className="btn-ghost"
            title="Chuyển chế độ xem Mobile / Desktop"
            style={{
              padding: '8px 12px',
              color: isMobilePreview ? 'var(--accent-gold)' : 'var(--text-muted)',
              borderColor: isMobilePreview ? 'var(--accent-gold)' : 'var(--border-subtle)',
            }}
          >
            {isMobilePreview ? <Smartphone size={16} /> : <Monitor size={16} />}
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
              {isMobilePreview ? 'Giao diện Mobile' : 'Giao diện Desktop'}
            </span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="btn-gold"
          >
            <PlusCircle size={16} />
            <span>Thêm Giao Dịch</span>
          </button>
        </div>
      </div>
    </header>
  );
};
