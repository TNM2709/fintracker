import React from 'react';
import type { MarketSummary } from '../types';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TickerBarProps {
  summary: MarketSummary | null;
  onSelectAsset?: (assetId: string) => void;
}

export const TickerBar: React.FC<TickerBarProps> = ({ summary, onSelectAsset }) => {
  if (!summary) return null;

  // Lấy giá SJC Hà Nội
  const sjc = summary.featured_gold?.find((g) => g.id === 'sjc-hanoi') || summary.featured_gold?.[0];

  const items = [
    {
      id: 'XAU-SJC',
      label: 'VÀNG SJC',
      value: sjc ? `${sjc.buy_price} - ${sjc.sell_price}` : '83.5 - 85.5',
      unit: 'tr/lượng',
      change: '+0.35%',
      isPositive: true,
      isGold: true,
    },
    {
      id: 'XAU-USD',
      label: 'VÀNG SPOT (XAU/USD)',
      value: `$${summary.world_gold_usd.toLocaleString('en-US', { minimumFractionDigits: 1 })}`,
      unit: '/ounce',
      change: '+0.54%',
      isPositive: true,
      isGold: true,
    },
    {
      id: 'SPREAD',
      label: 'CHÊNH LỆCH VÀNG SJC/TG',
      value: `+${summary.gold_vn_spread} tr`,
      unit: '/lượng',
      change: 'Spread',
      isPositive: true,
      isSpread: true,
    },
    {
      id: 'VN-INDEX',
      label: 'VN-INDEX',
      value: `${summary.vn_index.toFixed(2)}`,
      unit: 'pts',
      change: `${summary.vn_index_change >= 0 ? '+' : ''}${summary.vn_index_change.toFixed(2)}%`,
      isPositive: summary.vn_index_change >= 0,
    },
    {
      id: 'US-SP500',
      label: 'S&P 500',
      value: `${summary.sp500.toFixed(2)}`,
      unit: 'pts',
      change: `${summary.sp500_change >= 0 ? '+' : ''}${summary.sp500_change.toFixed(2)}%`,
      isPositive: summary.sp500_change >= 0,
    },
    {
      id: 'USDVND',
      label: 'TỶ GIÁ USD/VND',
      value: `${summary.usd_vnd_exchange.toLocaleString()}`,
      unit: 'VND',
      change: 'VCB Rate',
      isPositive: true,
    },
    {
      id: 'CRYPTO-BTC',
      label: 'BITCOIN',
      value: '$63,450',
      unit: 'USD',
      change: '+2.06%',
      isPositive: true,
    },
  ];

  // Nhân bản items để chạy ticker mượt mà vô tận
  const tickerItems = [...items, ...items];

  return (
    <div style={{
      background: 'rgba(13, 18, 34, 0.95)',
      borderBottom: '1px solid var(--border-subtle)',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      padding: '8px 0',
      position: 'relative',
    }}>
      <div className="ticker-track">
        {tickerItems.map((item, idx) => (
          <div
            key={idx}
            onClick={() => onSelectAsset && onSelectAsset(item.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '0 24px',
              borderRight: '1px solid rgba(255, 255, 255, 0.06)',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: item.isGold ? 'var(--accent-gold)' : 'var(--text-dim)',
            }}>
              {item.label}:
            </span>

            <span className="num-mono" style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: item.isGold ? 'var(--accent-gold-light)' : 'var(--text-main)',
            }}>
              {item.value} <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{item.unit}</span>
            </span>

            <span style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
              color: item.isPositive ? 'var(--accent-green)' : 'var(--accent-red)',
            }}>
              {item.isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {item.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
