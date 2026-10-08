import React from 'react';
import { Wallet, LineChart, Cpu, BarChart2 } from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'portfolio', label: 'Tài Sản', icon: Wallet },
    { id: 'market', label: 'Bảng Giá', icon: BarChart2 },
    { id: 'chart', label: 'Biểu Đồ', icon: LineChart },
    { id: 'forecast', label: 'Dự Đoán', icon: Cpu },
  ];

  return (
    <div
      className="mobile-only"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(7, 10, 19, 0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '10px 12px 14px 12px',
        zIndex: 100,
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              color: isActive ? 'var(--accent-gold)' : 'var(--text-dim)',
              cursor: 'pointer',
              flex: 1,
              transition: 'all 0.2s',
            }}
          >
            <Icon size={20} color={isActive ? 'var(--accent-gold)' : 'var(--text-dim)'} />
            <span style={{ fontSize: '0.72rem', fontWeight: isActive ? 700 : 500 }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
