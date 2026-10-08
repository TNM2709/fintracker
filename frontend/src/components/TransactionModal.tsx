import React, { useState } from 'react';
import type { Transaction, Asset } from '../types';
import { X, Check } from 'lucide-react';

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
  if (!isOpen) return null;

  const [assetId, setAssetId] = useState<string>('XAU-SJC');
  const [type, setType] = useState<'BUY' | 'SELL' | 'DIVIDEND'>('BUY');
  const [quantity, setQuantity] = useState<string>('1');
  const [price, setPrice] = useState<string>('85500000');
  const [fee, setFee] = useState<string>('0');
  const [notes, setNotes] = useState<string>('');

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
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 16,
    }}>
      <div className="glass-panel" style={{
        maxWidth: 500,
        width: '100%',
        padding: 24,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-glow)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Thêm Giao Dịch Vào Danh Mục</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Loại giao dịch */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>
              LOẠI GIAO DỊCH
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { id: 'BUY', label: 'MUA VÀO' },
                { id: 'SELL', label: 'BÁN RA' },
                { id: 'DIVIDEND', label: 'NHẬN CỔ TỨC' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id as any)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid',
                    borderColor: type === t.id ? (type === 'BUY' ? 'var(--accent-green)' : type === 'DIVIDEND' ? 'var(--accent-cyan)' : 'var(--accent-red)') : 'var(--border-subtle)',
                    background: type === t.id ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                    color: type === t.id ? '#fff' : 'var(--text-dim)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chọn tài sản */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>
              TÀI SẢN
            </label>
            <select
              value={assetId}
              onChange={(e) => handleAssetChange(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            >
              <optgroup label="Vàng">
                <option value="XAU-SJC">Vàng miếng SJC 999.9</option>
                <option value="XAU-USD">Vàng Thế Giới (XAU/USD)</option>
              </optgroup>
              <optgroup label="Cổ Phiếu Việt Nam">
                <option value="VN-FPT">FPT Telecom & AI</option>
                <option value="VN-VCB">Vietcombank</option>
                <option value="VN-HPG">Tập đoàn Hòa Phát</option>
                <option value="VN-VHM">Vinhomes</option>
                <option value="VN-MWG">Thế Giới Di Động</option>
                <option value="VN-TCB">Techcombank</option>
              </optgroup>
              <optgroup label="Quốc Tế & Crypto">
                <option value="US-AAPL">Apple Inc.</option>
                <option value="US-NVDA">NVIDIA Corp</option>
                <option value="US-TSLA">Tesla Inc.</option>
                <option value="CRYPTO-BTC">Bitcoin</option>
              </optgroup>
            </select>
          </div>

          {/* Khối lượng & Đơn giá */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>
                KHỐI LƯỢNG (SL)
              </label>
              <input
                type="number"
                step="any"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>
                ĐƠN GIÁ KHỚP
              </label>
              <input
                type="number"
                step="any"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Phí & Ghi chú */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>
              PHÍ GIAO DỊCH (VND / USD)
            </label>
            <input
              type="number"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>
              GHI CHÚ / CHIẾN LƯỢC
            </label>
            <input
              type="text"
              placeholder="VD: Mua tích sản tháng 10, gom vùng hỗ trợ..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose} className="btn-ghost" style={{ flex: 1 }}>
              Hủy
            </button>
            <button type="submit" className="btn-gold" style={{ flex: 2, justifyContent: 'center' }}>
              <Check size={16} /> Lưu Giao Dịch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
