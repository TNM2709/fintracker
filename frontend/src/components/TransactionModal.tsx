import React, { useState } from 'react';
import type { Transaction, Asset } from '../types';
import { useAuth } from '../context/useAuth';
import { X, Check, Lock, LogIn } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tx: Partial<Transaction>) => void;
  allAssets: Asset[];
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  allAssets,
}) => {
  const { isGuest, openAuthModal } = useAuth();

  const [assetId, setAssetId] = useState<string>('XAU-SJC');
  const [type, setType] = useState<'BUY' | 'SELL' | 'DIVIDEND'>('BUY');
  const [quantity, setQuantity] = useState<string>('1');
  const [price, setPrice] = useState<string>('85500000');
  const [fee, setFee] = useState<string>('0');
  const [notes, setNotes] = useState<string>('');

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
              backgroundColor: 'rgba(0, 229, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              color: '#00E5FF',
            }}
          >
            <Lock size={22} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#FAFAFA', margin: '0 0 8px 0' }}>
            Đăng Nhập Để Thêm Giao Dịch
          </h3>
          <p style={{ fontSize: '13px', color: '#A1A1AA', margin: '0 0 20px 0', lineHeight: 1.5 }}>
            Sổ cái giao dịch được lưu trữ và tính toán lãi/lỗ theo tài khoản của bạn. Vui lòng đăng nhập để lưu trữ dữ liệu cá nhân.
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

  const handleAssetChange = (newAssetId: string) => {
    setAssetId(newAssetId);
    const found = allAssets.find((a) => a.id === newAssetId);
    if (found) {
      setPrice(found.current_price.toString());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(quantity) || 0;
    const prc = parseFloat(price) || 0;
    const f = parseFloat(fee) || 0;

    const selected = allAssets.find((a) => a.id === assetId);

    onSubmit({
      asset_id: assetId,
      asset_symbol: selected?.symbol || assetId,
      asset_name: selected?.name || assetId,
      type,
      quantity: qty,
      price: prc,
      fee: f,
      tax: 0,
      total_amount: qty * prc + f,
      transaction_date: new Date().toISOString(),
      notes,
    });
    onClose();
  };

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
        maxWidth: 500,
        width: '100%',
        padding: 24,
        backgroundColor: '#18181B',
        border: '1px solid #3F3F46',
        borderRadius: 12,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#FAFAFA', margin: 0 }}>
            Thêm Giao Dịch Vào Danh Mục
          </h3>
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Loại giao dịch */}
          <div>
            <label style={{ fontSize: '13px', color: '#A1A1AA', fontWeight: 500, display: 'block', marginBottom: 6 }}>
              LOẠI GIAO DỊCH
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { id: 'BUY', label: 'MUA VÀO' },
                { id: 'SELL', label: 'BÁN RA' },
                { id: 'DIVIDEND', label: 'NHẬN CỔ TỨC' },
              ].map((t) => {
                const isActive = type === t.id;
                let activeColor = '#00E5FF';
                if (t.id === 'BUY') activeColor = '#10B981';
                if (t.id === 'SELL') activeColor = '#EF4444';

                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id as any)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid',
                      borderColor: isActive ? activeColor : '#3F3F46',
                      backgroundColor: isActive ? '#27272A' : '#09090B',
                      color: isActive ? activeColor : '#A1A1AA',
                      fontWeight: 500,
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chọn tài sản */}
          <div>
            <label style={{ fontSize: '13px', color: '#A1A1AA', fontWeight: 500, display: 'block', marginBottom: 6 }}>
              TÀI SẢN
            </label>
            <select
              value={assetId}
              onChange={(e) => handleAssetChange(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#09090B',
                border: '1px solid #3F3F46',
                color: '#FAFAFA',
                padding: '12px',
                borderRadius: 8,
                fontSize: '14px',
              }}
            >
              {allAssets.map((a) => (
                <option key={a.id} value={a.id}>
                  [{a.symbol}] {a.name} ({a.asset_type})
                </option>
              ))}
            </select>
          </div>

          {/* Khối lượng & Giá */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: '13px', color: '#A1A1AA', fontWeight: 500, display: 'block', marginBottom: 6 }}>
                KHỐI LƯỢNG / SỐ LƯỢNG
              </label>
              <input
                type="number"
                step="any"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', color: '#A1A1AA', fontWeight: 500, display: 'block', marginBottom: 6 }}>
                GIÁ KHỚP LỆNH (VND)
              </label>
              <input
                type="number"
                step="any"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="85500000"
              />
            </div>
          </div>

          {/* Phí giao dịch */}
          <div>
            <label style={{ fontSize: '13px', color: '#A1A1AA', fontWeight: 500, display: 'block', marginBottom: 6 }}>
              PHÍ GIAO DỊCH (VND)
            </label>
            <input
              type="number"
              step="any"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              placeholder="0"
            />
          </div>

          {/* Ghi chú */}
          <div>
            <label style={{ fontSize: '13px', color: '#A1A1AA', fontWeight: 500, display: 'block', marginBottom: 6 }}>
              GHI CHÚ GIAO DỊCH
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Mua tích sản tháng 10..."
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ flex: 1 }}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ flex: 2 }}
            >
              <Check size={16} />
              <span>Ghi Nhận Giao Dịch</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
