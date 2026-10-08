import React, { useState, useEffect } from 'react';
import type { PriceAlert, Asset } from '../types';
import { fetchAlerts, addAlert, deleteAlert } from '../services/api';
import { Bell, Trash2, Plus, X } from 'lucide-react';

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
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [assetId, setAssetId] = useState<string>('XAU-SJC');
  const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [targetPrice, setTargetPrice] = useState<string>('86000000');

  useEffect(() => {
    if (isOpen) {
      fetchAlerts()
        .then((data) => setAlerts(data))
        .catch((err) => console.error('Fetch alerts error:', err));
    }
  }, [isOpen]);

  const handleAssetSelect = (id: string) => {
    setAssetId(id);
    const found = allAssets.find((a) => a.id === id);
    if (found) {
      setTargetPrice(found.current_price.toString());
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
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
    try {
      await deleteAlert(id);
      setAlerts(alerts.filter((a) => a.id !== id));
    } catch (e) {
      console.error('Error deleting alert:', e);
    }
  };

  if (!isOpen) return null;

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
        maxWidth: 560,
        width: '100%',
        padding: 24,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-glow)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={18} color="var(--accent-gold)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Quản Lý Cảnh Báo Giá Tự Động</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Nhận thông báo tức thì khi giá vàng hoặc cổ phiếu chạm ngưỡng
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form tạo cảnh báo mới */}
        <form onSubmit={handleCreate} style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
        }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff', marginBottom: 12 }}>
            + THIẾT LẬP CẢNH BÁO MỚI
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr', gap: 10, alignItems: 'center' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>
                Tài Sản
              </label>
              <select
                value={assetId}
                onChange={(e) => handleAssetSelect(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 6,
                  padding: '8px 10px',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              >
                <option value="XAU-SJC">Vàng SJC</option>
                <option value="XAU-USD">XAU/USD (TG)</option>
                <option value="VN-INDEX">VN-INDEX</option>
                <option value="VN-FPT">FPT Telecom</option>
                <option value="VN-VCB">Vietcombank</option>
                <option value="US-NVDA">NVIDIA</option>
                <option value="CRYPTO-BTC">Bitcoin</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>
                Điều Kiện
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as any)}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 6,
                  padding: '8px 10px',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              >
                <option value="ABOVE">VƯỢT LÊN TRÊN (≥)</option>
                <option value="BELOW">GIẢM XUỐNG DƯỚI (≤)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>
                Giá Ngưỡng
              </label>
              <input
                type="number"
                step="any"
                required
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 6,
                  padding: '8px 10px',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  fontFamily: 'JetBrains Mono',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', marginTop: 12, justifyContent: 'center', padding: '8px 14px', fontSize: '0.85rem' }}
          >
            <Plus size={15} /> Kích Hoạt Cảnh Báo
          </button>
        </form>

        {/* Danh sách cảnh báo hiện tại */}
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10 }}>
          DANH SÁCH CẢNH BÁO ĐANG THEO DÕI ({alerts.length})
        </div>

        <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {alerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              Chưa có cảnh báo nào được đặt.
            </div>
          ) : (
            alerts.map((alt) => (
              <div
                key={alt.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <div>
                  <span style={{ fontWeight: 800, color: '#fff', marginRight: 8 }}>{alt.symbol}</span>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: alt.condition === 'ABOVE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                    color: alt.condition === 'ABOVE' ? 'var(--accent-green)' : 'var(--accent-red)',
                    marginRight: 8,
                  }}>
                    {alt.condition === 'ABOVE' ? '≥ VƯỢT' : '≤ GIẢM'}
                  </span>
                  <span className="num-mono" style={{ fontWeight: 700, color: 'var(--accent-gold)' }}>
                    {alt.target_price.toLocaleString()}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {alt.is_triggered ? (
                    <span style={{ fontSize: '0.72rem', color: 'var(--accent-green)', fontWeight: 700 }}>
                      ● ĐÃ CHẠM NGƯỠNG
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      Đang canh giá
                    </span>
                  )}
                  <button
                    onClick={() => handleDelete(alt.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 2 }}
                    title="Xóa cảnh báo"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
