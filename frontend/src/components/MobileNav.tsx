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
    <nav className="mobile-nav-bar">
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
              color: isActive ? '#00E5FF' : '#A1A1AA',
              cursor: 'pointer',
              flex: 1,
              transition: 'color 0.2s ease',
            }}
          >
            <Icon size={20} color={isActive ? '#00E5FF' : '#A1A1AA'} />
            <span style={{ fontSize: '12px', fontWeight: isActive ? 600 : 400 }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
