import React, { useState, useEffect, useCallback } from 'react';
import type { NotificationItem, NotificationSettings } from '../types';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  fetchNotificationSettings,
  updateNotificationSettings,
  sendTestNotification,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Bell,
  Sliders,
  CheckCheck,
  Trash2,
  Volume2,
  VolumeX,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Play,
  Save,
  Check,
} from 'lucide-react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

// Web Audio API Ding sound synthesis (Zero audio files needed, 100% reliable)
function playDingSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1); // A5

    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  } catch (e) {
    console.warn('Audio play error', e);
  }
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  onUnreadCountChange,
}) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState<'inbox' | 'settings'>('inbox');

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [filterUnread, setFilterUnread] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Settings state
  const [, setSettings] = useState<NotificationSettings | null>(null);
  const [priceAlerts, setPriceAlerts] = useState<boolean>(true);
  const [volatilityAlerts, setVolatilityAlerts] = useState<boolean>(true);
  const [txAlerts, setTxAlerts] = useState<boolean>(true);
  const [sound, setSound] = useState<boolean>(true);
  const [minChange, setMinChange] = useState<number>(2.0);
  const [watchedAssets, setWatchedAssets] = useState<string>('ALL');

  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [testSuccess, setTestSuccess] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const [notifsData, settingsData] = await Promise.all([
        fetchNotifications(50),
        fetchNotificationSettings(),
      ]);
      setNotifications(notifsData.notifications || []);
      setUnreadCount(notifsData.unread_count || 0);
      onUnreadCountChange?.(notifsData.unread_count || 0);

      setSettings(settingsData);
      setPriceAlerts(settingsData.enable_price_alerts);
      setVolatilityAlerts(settingsData.enable_volatility_alerts);
      setTxAlerts(settingsData.enable_transaction_alerts);
      setSound(settingsData.enable_sound);
      setMinChange(settingsData.min_change_percent || 2.0);
      setWatchedAssets(settingsData.watched_assets || 'ALL');
    } catch (e) {
      console.error('Error loading notification data:', e);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, onUnreadCountChange]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  if (!isOpen) return null;

  if (!isAuthenticated) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16,
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 420,
            backgroundColor: '#121214',
            border: '1px solid #27272A',
            borderRadius: 16,
            padding: 24,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 229, 255, 0.1)',
              border: '1px solid rgba(0, 229, 255, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              color: '#00E5FF',
            }}
          >
            <Bell size={24} />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#FAFAFA', margin: '0 0 8px 0' }}>
            Quản Lý & Tùy Biến Thông Báo
          </h3>
          <p style={{ fontSize: '13px', color: '#A1A1AA', margin: '0 0 20px 0', lineHeight: 1.5 }}>
            Vui lòng đăng nhập để nhận thông báo chạm giá mục tiêu, biến động thị trường và tự tùy biến các loại cảnh báo tới bạn.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => {
                onClose();
                openAuthModal('login');
              }}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: 8,
                backgroundColor: '#00E5FF',
                color: '#09090B',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Đăng Nhập Ngay
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                backgroundColor: '#27272A',
                color: '#FAFAFA',
                border: 'none',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      onUnreadCountChange?.(Math.max(0, unreadCount - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      onUnreadCountChange?.(0);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      const target = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (target && !target.is_read) {
        setUnreadCount((c) => Math.max(0, c - 1));
        onUnreadCountChange?.(Math.max(0, unreadCount - 1));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await updateNotificationSettings({
        enable_price_alerts: priceAlerts,
        enable_volatility_alerts: volatilityAlerts,
        enable_transaction_alerts: txAlerts,
        enable_sound: sound,
        min_change_percent: minChange,
        watched_assets: watchedAssets,
      });
      setSettings(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  };

  const handleTestNotification = async () => {
    try {
      const testItem = await sendTestNotification();
      if (sound) {
        playDingSound();
      }
      setNotifications((prev) => [testItem, ...prev]);
      setUnreadCount((c) => c + 1);
      onUnreadCountChange?.(unreadCount + 1);
      setTestSuccess(true);
      setTimeout(() => setTestSuccess(false), 3000);
    } catch (err) {
      console.error('Error testing notification:', err);
    }
  };

  const filteredList = filterUnread
    ? notifications.filter((n) => !n.is_read)
    : notifications;

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'PRICE_ALERT':
        return <TrendingUp size={16} color="#00E5FF" />;
      case 'VOLATILITY':
        return <AlertCircle size={16} color="#F59E0B" />;
      case 'TRANSACTION':
        return <DollarSign size={16} color="#10B981" />;
      default:
        return <Bell size={16} color="#A1A1AA" />;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 540,
          maxHeight: '90vh',
          backgroundColor: '#121214',
          border: '1px solid #27272A',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'scaleIn 0.2s ease-out',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #27272A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, rgba(24, 24, 27, 0.9), rgba(18, 18, 20, 0.9))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: 'rgba(0, 229, 255, 0.15)',
                border: '1px solid rgba(0, 229, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00E5FF',
              }}
            >
              <Bell size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#FAFAFA', margin: 0 }}>
                  Trung Tâm Thông Báo
                </h2>
                {unreadCount > 0 && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: '#00E5FF',
                      color: '#09090B',
                      padding: '1px 6px',
                      borderRadius: 999,
                    }}
                  >
                    {unreadCount} mới
                  </span>
                )}
              </div>
              <p style={{ fontSize: '12px', color: '#A1A1AA', margin: '2px 0 0 0' }}>
                Hộp thư cảnh báo & Tùy biến thông báo cá nhân
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
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switcher */}
        <div
          style={{
            padding: '12px 20px 0 20px',
            borderBottom: '1px solid #27272A',
            display: 'flex',
            gap: 16,
          }}
        >
          <button
            onClick={() => setActiveTab('inbox')}
            style={{
              padding: '8px 12px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'inbox' ? '2px solid #00E5FF' : '2px solid transparent',
              color: activeTab === 'inbox' ? '#00E5FF' : '#A1A1AA',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s',
            }}
          >
            <Bell size={14} />
            <span>Thông Báo Gần Đây ({notifications.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            style={{
              padding: '8px 12px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'settings' ? '2px solid #00E5FF' : '2px solid transparent',
              color: activeTab === 'settings' ? '#00E5FF' : '#A1A1AA',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s',
            }}
          >
            <Sliders size={14} />
            <span>Tùy Biến Cảnh Báo (Cá nhân)</span>
          </button>
        </div>

        {/* Tab 1: Inbox */}
        {activeTab === 'inbox' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {/* Filter toolbar */}
            <div
              style={{
                padding: '10px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #1F1F23',
                fontSize: '12px',
              }}
            >
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setFilterUnread(false)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 6,
                    border: 'none',
                    backgroundColor: !filterUnread ? '#27272A' : 'transparent',
                    color: !filterUnread ? '#FAFAFA' : '#71717A',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setFilterUnread(true)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 6,
                    border: 'none',
                    backgroundColor: filterUnread ? '#27272A' : 'transparent',
                    color: filterUnread ? '#00E5FF' : '#71717A',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  Chưa đọc ({unreadCount})
                </button>
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#00E5FF',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <CheckCheck size={14} />
                  <span>Đọc tất cả</span>
                </button>
              )}
            </div>

            {/* List */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '12px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                maxHeight: 440,
              }}
            >
              {isLoading ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#A1A1AA', fontSize: '13px' }}>
                  Đang tải thông báo...
                </div>
              ) : filteredList.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center' }}>
                  <Bell size={32} color="#3F3F46" style={{ margin: '0 auto 12px auto' }} />
                  <p style={{ color: '#FAFAFA', fontSize: '14px', margin: '0 0 4px 0', fontWeight: 500 }}>
                    Hộp thư trống
                  </p>
                  <p style={{ color: '#71717A', fontSize: '12px', margin: 0 }}>
                    {filterUnread
                      ? 'Bạn đã đọc hết tất cả thông báo!'
                      : 'Chưa có thông báo nào. Các cảnh báo giá và biến động thị trường sẽ xuất hiện tại đây.'}
                  </p>
                </div>
              ) : (
                filteredList.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      backgroundColor: item.is_read ? '#18181B' : 'rgba(0, 229, 255, 0.05)',
                      border: `1px solid ${item.is_read ? '#27272A' : 'rgba(0, 229, 255, 0.25)'}`,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      transition: 'all 0.15s',
                    }}
                  >
                    <div
                      style={{
                        padding: 6,
                        borderRadius: 6,
                        backgroundColor: '#09090B',
                        border: '1px solid #27272A',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 2,
                      }}
                    >
                      {getNotifIcon(item.type)}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                        <h4
                          style={{
                            fontSize: '13px',
                            fontWeight: item.is_read ? 500 : 600,
                            color: item.is_read ? '#D4D4D8' : '#FAFAFA',
                            margin: 0,
                          }}
                        >
                          {item.title}
                        </h4>
                        <span style={{ fontSize: '11px', color: '#71717A', flexShrink: 0 }}>
                          {new Date(item.created_at).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: '12px',
                          color: '#A1A1AA',
                          margin: '4px 0 0 0',
                          lineHeight: 1.4,
                        }}
                      >
                        {item.message}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      {!item.is_read && (
                        <button
                          onClick={() => handleMarkRead(item.id)}
                          title="Đánh dấu đã đọc"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#00E5FF',
                            cursor: 'pointer',
                            padding: 4,
                          }}
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(item.id)}
                        title="Xóa thông báo"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#71717A',
                          cursor: 'pointer',
                          padding: 4,
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Settings (Customer preferences) */}
        {activeTab === 'settings' && (
          <form
            onSubmit={handleSaveSettings}
            style={{
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              overflowY: 'auto',
              maxHeight: 460,
            }}
          >
            {saveSuccess && (
              <div
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '10px 14px',
                  borderRadius: 8,
                  color: '#10B981',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Check size={16} />
                <span>Cấu hình thông báo đã được lưu thành công!</span>
              </div>
            )}

            {testSuccess && (
              <div
                style={{
                  backgroundColor: 'rgba(0, 229, 255, 0.15)',
                  border: '1px solid rgba(0, 229, 255, 0.3)',
                  padding: '10px 14px',
                  borderRadius: 8,
                  color: '#00E5FF',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Volume2 size={16} />
                <span>Đã phát âm thanh chuông và gửi thông báo mẫu vào Hộp thư!</span>
              </div>
            )}

            {/* Toggle 1: Price alerts */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                backgroundColor: '#18181B',
                border: '1px solid #27272A',
                borderRadius: 10,
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#FAFAFA' }}>
                  Cảnh báo giá chạm mục tiêu
                </div>
                <div style={{ fontSize: '12px', color: '#A1A1AA', marginTop: 2 }}>
                  Nhận thông báo khi vàng, cổ phiếu, crypto chạm ngưỡng trên/dưới bạn đã đặt.
                </div>
              </div>
              <input
                type="checkbox"
                checked={priceAlerts}
                onChange={(e) => setPriceAlerts(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: '#00E5FF', cursor: 'pointer' }}
              />
            </div>

            {/* Toggle 2: Volatility alerts */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                backgroundColor: '#18181B',
                border: '1px solid #27272A',
                borderRadius: 10,
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#FAFAFA' }}>
                  Cảnh báo biến động mạnh thị trường
                </div>
                <div style={{ fontSize: '12px', color: '#A1A1AA', marginTop: 2 }}>
                  Tự động cảnh báo khi có tài sản tăng/giảm đột biến vượt ngưỡng bạn chọn.
                </div>
              </div>
              <input
                type="checkbox"
                checked={volatilityAlerts}
                onChange={(e) => setVolatilityAlerts(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: '#00E5FF', cursor: 'pointer' }}
              />
            </div>

            {/* Threshold slider for volatility */}
            {volatilityAlerts && (
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: '#09090B',
                  border: '1px solid #27272A',
                  borderRadius: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#D4D4D8' }}>
                  <span>Ngưỡng biến động kích hoạt:</span>
                  <span style={{ fontWeight: 600, color: '#00E5FF' }}>±{minChange}%</span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  {[1.0, 2.0, 3.0, 5.0].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setMinChange(val)}
                      style={{
                        flex: 1,
                        padding: '6px',
                        borderRadius: 6,
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: minChange === val ? '#00E5FF' : '#18181B',
                        color: minChange === val ? '#09090B' : '#A1A1AA',
                        cursor: 'pointer',
                      }}
                    >
                      ±{val}%
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Toggle 3: Transaction alerts */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                backgroundColor: '#18181B',
                border: '1px solid #27272A',
                borderRadius: 10,
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#FAFAFA' }}>
                  Thông báo phát sinh giao dịch mới
                </div>
                <div style={{ fontSize: '12px', color: '#A1A1AA', marginTop: 2 }}>
                  Gửi xác nhận tức thì khi bạn ghi nhận giao dịch mua, bán hoặc cổ tức.
                </div>
              </div>
              <input
                type="checkbox"
                checked={txAlerts}
                onChange={(e) => setTxAlerts(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: '#00E5FF', cursor: 'pointer' }}
              />
            </div>

            {/* Toggle 4: Sound effect */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                backgroundColor: '#18181B',
                border: '1px solid #27272A',
                borderRadius: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {sound ? <Volume2 size={18} color="#00E5FF" /> : <VolumeX size={18} color="#71717A" />}
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#FAFAFA' }}>
                    Âm thanh chuông báo
                  </div>
                  <div style={{ fontSize: '12px', color: '#A1A1AA', marginTop: 2 }}>
                    Phát tiếng 'Ding' nhẹ khi có thông báo chạm mốc giá quan trọng.
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={sound}
                onChange={(e) => setSound(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: '#00E5FF', cursor: 'pointer' }}
              />
            </div>

            {/* Watched assets filter */}
            <div style={{ marginTop: 2 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#D4D4D8', marginBottom: 6 }}>
                Bộ lọc tài sản nhận thông báo:
              </label>
              <select
                value={watchedAssets}
                onChange={(e) => setWatchedAssets(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  backgroundColor: '#09090B',
                  border: '1px solid #3F3F46',
                  borderRadius: 8,
                  color: '#FAFAFA',
                  fontSize: '13px',
                }}
              >
                <option value="ALL">Tất cả tài sản thị trường (Vàng, Chứng khoán, Crypto)</option>
                <option value="GOLD">Chỉ theo dõi Vàng SJC & Thế Giới</option>
                <option value="STOCKS">Chỉ theo dõi Cổ phiếu VN (HOSE/HNX) & Mỹ</option>
                <option value="CRYPTO">Chỉ theo dõi Crypto (BTC/ETH/SOL)</option>
              </select>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button
                type="submit"
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: 8,
                  backgroundColor: '#00E5FF',
                  color: '#09090B',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Save size={15} />
                <span>Lưu Cấu Hình Tùy Biến</span>
              </button>

              <button
                type="button"
                onClick={handleTestNotification}
                style={{
                  padding: '11px 16px',
                  borderRadius: 8,
                  backgroundColor: '#27272A',
                  color: '#FAFAFA',
                  border: '1px solid #3F3F46',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
                title="Gửi thông báo thử nghiệm để kiểm tra âm thanh & thông báo"
              >
                <Play size={14} color="#00E5FF" />
                <span>Thử Nghiệm</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
