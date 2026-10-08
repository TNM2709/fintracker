import React from 'react';
import type { MarketSummary } from '../types';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TickerBarProps {
  summary: MarketSummary | null;
  onSelectAsset?: (assetId: string) => void;
}

export const TickerBar: React.FC<TickerBarProps> = ({ summary, onSelectAsset }) => {
  if (!summary) return null;

  const sjc = summary.featured_gold?.find((g) => g.id === 'sjc-hanoi') || summary.featured_gold?.[0];

  const items = [
    {
      id: 'XAU-SJC',
      symbol: 'SJC',
      label: 'Vàng Miếng SJC',
      value: sjc ? `${sjc.buy_price} - ${sjc.sell_price}` : '138.5 - 140.5',
      unit: 'tr/lượng',
      change: '+0.35%',
      isPositive: true,
      tag: 'GOLD',
    },
    {
      id: 'XAU-USD',
      symbol: 'XAU/USD',
      label: 'Spot Gold',
      value: `$${summary.world_gold_usd.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`,
      unit: '/oz',
      change: '+0.54%',
      isPositive: true,
      tag: 'WORLD',
    },
    {
      id: 'SPREAD',
      symbol: 'SPREAD',
      label: 'Chênh Lệch SJC/TG',
      value: `+${summary.gold_vn_spread} tr`,
      unit: '/lượng',
      change: 'Spread',
      isPositive: true,
      tag: 'ARBITRAGE',
    },
    {
      id: 'VN-INDEX',
      symbol: 'VN-INDEX',
      label: 'VN-Index',
      value: `${summary.vn_index.toFixed(2)}`,
      unit: 'pts',
      change: `${summary.vn_index_change >= 0 ? '+' : ''}${summary.vn_index_change.toFixed(2)}%`,
      isPositive: summary.vn_index_change >= 0,
      tag: 'HOSE',
    },
    {
      id: 'US-SP500',
      symbol: 'S&P 500',
      label: 'S&P 500 Index',
      value: `${summary.sp500.toFixed(2)}`,
      unit: 'pts',
      change: `${summary.sp500_change >= 0 ? '+' : ''}${summary.sp500_change.toFixed(2)}%`,
      isPositive: summary.sp500_change >= 0,
      tag: 'US',
    },
    {
      id: 'USDVND',
      symbol: 'USD/VND',
      label: 'Tỷ Giá Ngoại Tệ',
      value: `${summary.usd_vnd_exchange.toLocaleString()}`,
      unit: 'VND',
      change: 'VCB Rate',
      isPositive: true,
      tag: 'FX',
    },
    {
      id: 'CRYPTO-BTC',
      symbol: 'BTC/USD',
      label: 'Bitcoin',
      value: '$82,830',
      unit: 'USD',
      change: '+2.06%',
      isPositive: true,
      tag: 'CRYPTO',
    },
    {
      id: 'CRYPTO-ETH',
      symbol: 'ETH/USD',
      label: 'Ethereum',
      value: '$2,570',
      unit: 'USD',
      change: '-1.74%',
      isPositive: false,
      tag: 'CRYPTO',
    },
  ];

  // Repeat for continuous marquee
  const tickerItems = [...items, ...items];

  return (
    <div style={{
      backgroundColor: 'rgba(9, 9, 11, 0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #27272A',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      padding: '7px 0',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
    }}>
      {/* Live Market Badge on Left */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 10,
        backgroundColor: '#09090B',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        borderRight: '1px solid #27272A',
        boxShadow: '10px 0 20px rgba(9, 9, 11, 0.8)',
      }} className="desktop-only">
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            backgroundColor: '#10B981',
            boxShadow: '0 0 10px #10B981',
            display: 'inline-block',
          }}
        />
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#FAFAFA', letterSpacing: '0.04em' }}>
          LIVE FEED
        </span>
      </div>

      <div className="ticker-track" style={{ paddingLeft: 120 }}>
        {tickerItems.map((item, idx) => (
          <div
            key={idx}
            onClick={() => onSelectAsset && onSelectAsset(item.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '3px 16px',
              margin: '0 4px',
              borderRadius: 6,
              backgroundColor: 'rgba(24, 24, 27, 0.6)',
              border: '1px solid #27272A',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#27272A';
              e.currentTarget.style.borderColor = '#3F3F46';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(24, 24, 27, 0.6)';
              e.currentTarget.style.borderColor = '#27272A';
            }}
          >
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '1px 5px',
              borderRadius: 4,
              backgroundColor: '#09090B',
              color: '#00E5FF',
              border: '1px solid rgba(0, 229, 255, 0.2)',
            }}>
              {item.symbol}
            </span>

            <span style={{
              fontSize: '12px',
              fontWeight: 500,
              color: '#A1A1AA',
            }}>
              {item.label}
            </span>

            <span className="num-mono" style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#FAFAFA',
            }}>
              {item.value} <span style={{ fontSize: '10px', color: '#71717A' }}>{item.unit}</span>
            </span>

            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
              padding: '1px 6px',
              borderRadius: 4,
              backgroundColor: item.isPositive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              color: item.isPositive ? '#10B981' : '#EF4444',
            }}>
              {item.isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {item.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
