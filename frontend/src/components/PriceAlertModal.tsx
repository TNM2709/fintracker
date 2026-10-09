import React, { useState, useEffect } from 'react';
import type { PriceAlert, Asset } from '../types';
import { fetchAlerts, addAlert, deleteAlert } from '../services/api';
import { useAuth } from '../context/useAuth';
import { Bell, Trash2, Plus, X, Lock, LogIn } from 'lucide-react';

interface PriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  allAssets: Asset[];
}

export const PriceAlertModal: React.FC<PriceAlertModalProps> = ({
  isOpen,
  onClose,
  allAssets,
}) => {
  const { isAuthenticated, isGuest, openAuthModal } = useAuth();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [assetId, setAssetId] = useState<string>('XAU-SJC');
  const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [targetPrice, setTargetPrice] = useState<string>('86000000');

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchAlerts()
        .then((data) => setAlerts(data))
        .catch((err) => console.error('Fetch alerts error:', err));
    }
  }, [isOpen, isAuthenticated]);

  const handleAssetSelect = (id: string) => {
    setAssetId(id);
    const found = allAssets.find((a) => a.id === id);
    if (found) {
      setTargetPrice(found.current_price.toString());
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) {
      openAuthModal('login');
      return;
    }
    const p = parseFloat(targetPrice) || 0;
    const selected = allAssets.find((a) => a.id === assetId);

    try {
      const created = await addAlert({
        asset_id: assetId,
        symbol: selected?.symbol || assetId,
        condition,
        target_price: p,
      });
      setAlerts([created, ...alerts]);
    } catch (e) {
      console.error('Error adding alert:', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (isGuest) {
      openAuthModal('login');
      return;
    }
    try {
      await deleteAlert(id);
      setAlerts(alerts.filter((a) => a.id !== id));
    } catch (e) {
      console.error('Error deleting alert:', e);
    }
  };

  if (!isOpen) return null;

  if (isGuest) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(9, 9, 11, 0.8)',
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
            maxWidth: 420,
            width: '100%',
            padding: 24,
            backgroundColor: '#18181B',
            border: '1px solid #3F3F46',
            borderRadius: 16,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              color: '#F59E0B',
            }}
          >
            <Lock size={22} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#FAFAFA', margin: '0 0 8px 0' }}>
            Cần Đăng Nhập Để Đặt Cảnh Báo
          </h3>
          <p style={{ fontSize: '13px', color: '#A1A1AA', margin: '0 0 20px 0', lineHeight: 1.5 }}>
            Cảnh báo giá được gắn với tài khoản cá nhân để gửi thông báo tức thời khi giá chạm ngưỡng. Vui lòng đăng nhập để sử dụng.
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <LogIn size={15} />
              <span>Đăng Nhập Ngay</span>
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
        maxWidth: 520,
        width: '100%',
        padding: 24,
        backgroundColor: '#18181B',
        border: '1px solid #3F3F46',
        borderRadius: 12,
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              backgroundColor: '#27272A',
              border: '1px solid #3F3F46',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00E5FF',
            }}>
              <Bell size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#FAFAFA', margin: 0 }}>
                Cảnh Báo Giá Thông Minh
              </h3>
              <p style={{ fontSize: '13px', color: '#A1A1AA', margin: '2px 0 0' }}>
                Thông báo thời gian thực khi giá chạm ngưỡng
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
            <X size={20} />
          </button>
        </div>

        {/* Form Tạo Mới */}
        <form onSubmit={handleCreate} style={{
          backgroundColor: '#09090B',
          padding: 16,
          borderRadius: 8,
          border: '1px solid #3F3F46',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          marginBottom: 20,
        }}>
          <div>
            <label style={{ fontSize: '13px', color: '#A1A1AA', fontWeight: 500, display: 'block', marginBottom: 6 }}>
              CHỌN TÀI SẢN
            </label>
            <select
              value={assetId}
              onChange={(e) => handleAssetSelect(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#18181B',
                border: '1px solid #3F3F46',
                color: '#FAFAFA',
                padding: '10px 12px',
                borderRadius: 8,
                fontSize: '14px',
              }}
            >
              {allAssets.map((a) => (
                <option key={a.id} value={a.id}>
                  [{a.symbol}] {a.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: '13px', color: '#A1A1AA', fontWeight: 500, display: 'block', marginBottom: 6 }}>
                ĐIỀU KIỆN
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as any)}
                style={{
                  width: '100%',
                  backgroundColor: '#18181B',
                  border: '1px solid #3F3F46',
                  color: '#FAFAFA',
                  padding: '10px 12px',
                  borderRadius: 8,
                  fontSize: '14px',
                }}
              >
                <option value="ABOVE">VƯỢT LÊN TRÊN (&ge;)</option>
                <option value="BELOW">GIẢM XUỐNG DƯỚI (&le;)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '13px', color: '#A1A1AA', fontWeight: 500, display: 'block', marginBottom: 6 }}>
                GIÁ MỤC TIÊU (VND)
              </label>
              <input
                type="number"
                step="any"
                required
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="VD: 86000000"
                style={{
                  backgroundColor: '#18181B',
                  border: '1px solid #3F3F46',
                  color: '#FAFAFA',
                  padding: '10px 12px',
                  borderRadius: 8,
                  fontSize: '14px',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ marginTop: 4, width: '100%' }}
          >
            <Plus size={16} />
            <span>Thêm Cảnh Báo Mới</span>
          </button>
        </form>

        {/* Danh Sách Cảnh Báo Hiện Có */}
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#A1A1AA', marginBottom: 12 }}>
            CÁC CẢNH BÁO ĐANG THEO DÕI ({alerts.length})
          </h4>

          {alerts.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '24px 16px',
              backgroundColor: '#09090B',
              borderRadius: 8,
              border: '1px solid #3F3F46',
            }}>
              <p style={{ fontSize: '14px', color: '#71717A', margin: 0 }}>
                Chưa có cảnh báo nào được kích hoạt.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alerts.map((alt) => (
                <div
                  key={alt.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 8,
                    backgroundColor: '#09090B',
                    border: '1px solid #3F3F46',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#FAFAFA' }}>
                        {alt.symbol}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontWeight: 500,
                        backgroundColor: alt.condition === 'ABOVE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: alt.condition === 'ABOVE' ? '#10B981' : '#EF4444',
                        border: `1px solid ${alt.condition === 'ABOVE' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                      }}>
                        {alt.condition === 'ABOVE' ? '≥ TĂNG VƯỢT' : '≤ GIẢM DƯỚI'}
                      </span>
                    </div>
                    <div className="num-mono" style={{ fontSize: '14px', fontWeight: 600, color: '#00E5FF', marginTop: 4 }}>
                      {alt.target_price.toLocaleString('vi-VN')} VND
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(alt.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#EF4444',
                      cursor: 'pointer',
                      padding: 6,
                      borderRadius: 6,
                    }}
                    title="Xóa cảnh báo"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
