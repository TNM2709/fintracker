import React, { useState } from 'react';
import {
  PlusCircle,
  Search,
  Smartphone,
  Monitor,
  RefreshCw,
  Bell,
  Shield,
  User,
  LogIn,
  UserPlus,
  LogOut,
  Sliders,
} from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';

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
  unreadNotifCount?: number;
  onOpenNotifModal: () => void;
  onOpenAdminModal: () => void;
  onOpenProfileModal: () => void;
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
  unreadNotifCount = 0,
  onOpenNotifModal,
  onOpenAdminModal,
  onOpenProfileModal,
}) => {
  const { currency, setCurrency, goldUnit, setGoldUnit } = useCurrency();
  const { user, isAuthenticated, isAdmin, isGuest, openAuthModal, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const navTabs = [
    { id: 'portfolio', label: 'Tài Sản & Sổ Cái' },
    { id: 'market', label: 'Bảng Giá & Vàng SJC' },
    { id: 'chart', label: 'Biểu Đồ Kỹ Thuật' },
    { id: 'forecast', label: 'Dự Báo Monte Carlo' },
  ];

  const handleAddClick = () => {
    if (isGuest) {
      openAuthModal('login');
    } else {
      onOpenAddModal();
    }
  };

  return (
    <header
      style={{
        borderBottom: '1px solid #27272A',
        backgroundColor: 'rgba(24, 24, 27, 0.85)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: 1440,
          margin: '0 auto',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        {/* Brand & Connection Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 8,
              backgroundColor: '#00E5FF',
              color: '#09090B',
              fontWeight: 700,
              fontSize: '16px',
              boxShadow: '0 0 16px rgba(0, 229, 255, 0.25)',
            }}
          >
            FT
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: '16px', fontWeight: 600, color: '#FAFAFA', margin: 0, letterSpacing: '-0.02em' }}>
                FinTracker Pro
              </h1>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#00E5FF',
                  backgroundColor: 'rgba(0, 229, 255, 0.1)',
                  border: '1px solid rgba(0, 229, 255, 0.25)',
                  padding: '1px 6px',
                  borderRadius: 4,
                }}
              >
                v2.0
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', color: '#A1A1AA', marginTop: 2 }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: isConnected ? '#10B981' : '#EF4444',
                  boxShadow: isConnected ? '0 0 8px #10B981' : 'none',
                  display: 'inline-block',
                }}
              />
              <span>{isConnected ? 'Realtime Feed Active' : 'Connecting to Server...'}</span>
            </div>
          </div>
        </div>

        {/* Central Segmented Control Navigation */}
        <nav
          style={{
            display: 'flex',
            backgroundColor: '#09090B',
            border: '1px solid #27272A',
            borderRadius: 8,
            padding: 3,
            gap: 2,
          }}
          className="desktop-only"
        >
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                style={{
                  padding: '7px 16px',
                  borderRadius: 6,
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#FAFAFA' : '#A1A1AA',
                  backgroundColor: isActive ? '#27272A' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = '#FAFAFA';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = '#A1A1AA';
                }}
              >
                {tab.label}
                {isActive && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: '25%',
                      right: '25%',
                      height: 2,
                      backgroundColor: '#00E5FF',
                      borderRadius: 2,
                    }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Tools & Action Area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Currency Toggle Segment */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#09090B',
              border: '1px solid #3F3F46',
              borderRadius: 8,
              padding: 2,
            }}
          >
            <button
              onClick={() => setCurrency('VND')}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: currency === 'VND' ? '#00E5FF' : 'transparent',
                color: currency === 'VND' ? '#09090B' : '#A1A1AA',
                transition: 'all 0.15s ease',
              }}
            >
              ₫ VND
            </button>
            <button
              onClick={() => setCurrency('USD')}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: currency === 'USD' ? '#00E5FF' : 'transparent',
                color: currency === 'USD' ? '#09090B' : '#A1A1AA',
                transition: 'all 0.15s ease',
              }}
            >
              $ USD
            </button>
          </div>

          {/* Gold Unit Toggle Segment */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#09090B',
              border: '1px solid #3F3F46',
              borderRadius: 8,
              padding: 2,
            }}
            className="desktop-only"
          >
            <button
              onClick={() => setGoldUnit('LUONG')}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: goldUnit === 'LUONG' ? '#27272A' : 'transparent',
                color: goldUnit === 'LUONG' ? '#FAFAFA' : '#A1A1AA',
                transition: 'all 0.15s ease',
              }}
            >
              Lượng
            </button>
            <button
              onClick={() => setGoldUnit('CHI')}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: goldUnit === 'CHI' ? '#27272A' : 'transparent',
                color: goldUnit === 'CHI' ? '#FAFAFA' : '#A1A1AA',
                transition: 'all 0.15s ease',
              }}
            >
              Chỉ
            </button>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: 150 }} className="desktop-only">
            <Search size={14} color="#71717A" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Tìm mã..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                paddingLeft: 30,
                paddingRight: 10,
                paddingTop: 6,
                paddingBottom: 6,
                fontSize: '12px',
                borderRadius: 8,
                backgroundColor: '#09090B',
                border: '1px solid #3F3F46',
                color: '#FAFAFA',
                width: '100%',
              }}
            />
          </div>

          {/* Quick Refresh */}
          <button
            onClick={onRefresh}
            style={{
              padding: 8,
              borderRadius: 8,
              border: '1px solid #3F3F46',
              backgroundColor: 'transparent',
              color: '#A1A1AA',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#27272A')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={14} />
          </button>

          {/* Alert Modal Button */}
          <button
            onClick={onOpenAlertModal}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid #3F3F46',
              backgroundColor: 'transparent',
              color: '#FAFAFA',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#27272A')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            title="Quản lý cảnh báo giá"
          >
            <Bell size={14} color="#F59E0B" />
            <span className="desktop-only">Cảnh Báo Giá</span>
          </button>

          {/* Notification Center Button with unread badge */}
          <button
            onClick={onOpenNotifModal}
            style={{
              position: 'relative',
              padding: 8,
              borderRadius: 8,
              border: '1px solid #3F3F46',
              backgroundColor: unreadNotifCount > 0 ? 'rgba(0, 229, 255, 0.1)' : 'transparent',
              color: unreadNotifCount > 0 ? '#00E5FF' : '#A1A1AA',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            title="Trung tâm thông báo & Tùy biến cảnh báo"
          >
            <Bell size={15} />
            {unreadNotifCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  backgroundColor: '#00E5FF',
                  color: '#09090B',
                  fontSize: '10px',
                  fontWeight: 700,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 8px #00E5FF',
                }}
              >
                {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
              </span>
            )}
          </button>

          {/* Admin Control Badge Button (If Admin) */}
          {isAdmin && (
            <button
              onClick={onOpenAdminModal}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid rgba(239, 68, 68, 0.4)',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#EF4444',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
              title="Mở Bảng điều khiển Quản trị viên"
            >
              <Shield size={14} />
              <span className="desktop-only">Quản Trị</span>
            </button>
          )}

          {/* Mobile Simulator Preview Toggle */}
          <button
            onClick={onToggleMobilePreview}
            style={{
              padding: 8,
              borderRadius: 8,
              border: '1px solid #3F3F46',
              backgroundColor: isMobilePreview ? '#27272A' : 'transparent',
              color: isMobilePreview ? '#00E5FF' : '#A1A1AA',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            title={isMobilePreview ? "Chuyển sang giao diện Desktop" : "Chuyển sang mô phỏng Mobile"}
          >
            {isMobilePreview ? <Monitor size={15} /> : <Smartphone size={15} />}
          </button>

          {/* Primary Action: Add Transaction */}
          <button
            onClick={handleAddClick}
            style={{
              padding: '8px 14px',
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
              transition: 'all 0.2s ease',
              boxShadow: '0 0 16px rgba(0, 229, 255, 0.2)',
            }}
            title={isGuest ? 'Đăng nhập để thêm giao dịch vào sổ cái' : 'Thêm giao dịch mới'}
          >
            <PlusCircle size={15} />
            <span className="desktop-only">Thêm Giao Dịch</span>
          </button>

          {/* Authentication Area */}
          {isAuthenticated && user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 8px 4px 4px',
                  backgroundColor: '#18181B',
                  border: '1px solid #3F3F46',
                  borderRadius: 20,
                  cursor: 'pointer',
                  color: '#FAFAFA',
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    backgroundColor: user.role === 'admin' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 229, 255, 0.2)',
                    color: user.role === 'admin' ? '#EF4444' : '#00E5FF',
                    border: `1px solid ${user.role === 'admin' ? '#EF4444' : '#00E5FF'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  {user.username.slice(0, 2).toUpperCase()}
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600 }} className="desktop-only">
                  {user.username}
                </span>
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '110%',
                    right: 0,
                    width: 200,
                    backgroundColor: '#18181B',
                    border: '1px solid #27272A',
                    borderRadius: 10,
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                    padding: 6,
                    zIndex: 200,
                    animation: 'fadeIn 0.15s ease',
                  }}
                >
                  <div style={{ padding: '8px 10px', borderBottom: '1px solid #27272A', marginBottom: 4 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#FAFAFA' }}>
                      {user.full_name || user.username}
                    </div>
                    <div style={{ fontSize: '11px', color: '#71717A' }}>
                      {user.email}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenProfileModal();
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 6,
                      background: 'none',
                      border: 'none',
                      color: '#D4D4D8',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#27272A')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <User size={14} />
                    <span>Hồ sơ cá nhân</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenNotifModal();
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 6,
                      background: 'none',
                      border: 'none',
                      color: '#D4D4D8',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#27272A')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Sliders size={14} />
                    <span>Tùy biến thông báo</span>
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenAdminModal();
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 6,
                        background: 'none',
                        border: 'none',
                        color: '#EF4444',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#27272A')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <Shield size={14} />
                      <span>Trang Quản Trị</span>
                    </button>
                  )}

                  <div style={{ height: 1, backgroundColor: '#27272A', margin: '4px 0' }} />

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 6,
                      background: 'none',
                      border: 'none',
                      color: '#EF4444',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#27272A')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <LogOut size={14} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => openAuthModal('login')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  backgroundColor: 'transparent',
                  border: '1px solid #3F3F46',
                  color: '#FAFAFA',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#27272A')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <LogIn size={13} />
                <span>Đăng Nhập</span>
              </button>

              <button
                onClick={() => openAuthModal('register')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  backgroundColor: 'rgba(0, 229, 255, 0.12)',
                  border: '1px solid rgba(0, 229, 255, 0.35)',
                  color: '#00E5FF',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  transition: 'all 0.15s ease',
                }}
                className="desktop-only"
              >
                <UserPlus size={13} />
                <span>Đăng Ký</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
