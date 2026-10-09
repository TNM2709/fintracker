import React, { useState, useEffect, useMemo } from 'react';
import type { MarketSummary, PortfolioSummary, Transaction, PriceAlert, NotificationItem } from './types';
import {
  fetchMarketSummary,
  fetchPortfolioSummary,
  fetchNotifications,
  addTransaction,
  deleteTransaction,
  resetPortfolio,
  RealtimeTickerClient,
} from './services/api';
import { Header } from './components/Header';
import { TickerBar } from './components/TickerBar';
import { PortfolioTab } from './components/PortfolioTab';
import { MarketTab } from './components/MarketTab';
import { ChartTab } from './components/ChartTab';
import { ForecastTab } from './components/ForecastTab';
import { TransactionModal } from './components/TransactionModal';
import { PriceAlertModal } from './components/PriceAlertModal';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { NotificationModal } from './components/NotificationModal';
import { AdminModal } from './components/AdminModal';
import { MobileNav } from './components/MobileNav';
import { CurrencyProvider, useCurrency } from './context/CurrencyContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { X, AlertCircle, DollarSign, TrendingUp } from 'lucide-react';

const MainApp: React.FC = () => {
  const { setUsdVndRate } = useCurrency();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('portfolio');
  const [selectedAssetId, setSelectedAssetId] = useState<string>('XAU-SJC');
  const [isMobilePreview, setIsMobilePreview] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);

  const [marketSummary, setMarketSummary] = useState<MarketSummary | null>(null);
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0);
  const [activeToast, setActiveToast] = useState<{
    title: string;
    message: string;
    type?: string;
  } | null>(null);

  // Load initial market & portfolio
  useEffect(() => {
    fetchMarketSummary()
      .then((data) => {
        setMarketSummary(data);
        if (data.usd_vnd_exchange) setUsdVndRate(data.usd_vnd_exchange);
      })
      .catch((err) => console.error('Initial market fetch error:', err));
  }, [setUsdVndRate]);

  // Load portfolio & notification count whenever user state changes (login, logout, switch)
  useEffect(() => {
    fetchPortfolioSummary()
      .then((data) => setPortfolioSummary(data))
      .catch((err) => console.error('Initial portfolio fetch error:', err));

    if (isAuthenticated) {
      fetchNotifications(10)
        .then((res) => setUnreadNotifCount(res.unread_count || 0))
        .catch(() => {});
    } else {
      setUnreadNotifCount(0);
    }
  }, [isAuthenticated, user?.id]);

  // Realtime WebSocket Stream from Go Backend
  useEffect(() => {
    const client = new RealtimeTickerClient();

    const unsubTicker = client.onUpdate((summary) => {
      setMarketSummary(summary);
      if (summary.usd_vnd_exchange) setUsdVndRate(summary.usd_vnd_exchange);
      setIsConnected(true);
    });

    // Lắng nghe cảnh báo giá chạm ngưỡng realtime
    const unsubAlert = client.onAlertTrigger((alert: PriceAlert) => {
      setActiveToast({
        title: `CẢNH BÁO GIÁ: ${alert.symbol}`,
        message: `Đã chạm ngưỡng ${alert.condition === 'ABOVE' ? '≥' : '≤'} ${alert.target_price.toLocaleString()}!`,
        type: 'PRICE_ALERT',
      });
      setUnreadNotifCount((c) => c + 1);
      setTimeout(() => setActiveToast(null), 8000);
    });

    // Lắng nghe thông báo hệ thống & biến động realtime
    const unsubNotification = client.onNotification((notif: NotificationItem) => {
      setActiveToast({
        title: notif.title,
        message: notif.message,
        type: notif.type,
      });
      setUnreadNotifCount((c) => c + 1);
      setTimeout(() => setActiveToast(null), 8000);
    });

    const checkInterval = setInterval(() => {
      setIsConnected(client.getStatus());
    }, 2000);

    return () => {
      unsubTicker();
      unsubAlert();
      unsubNotification();
      clearInterval(checkInterval);
    };
  }, [setUsdVndRate]);

  const handleRefresh = async () => {
    try {
      const [m, p] = await Promise.all([fetchMarketSummary(), fetchPortfolioSummary()]);
      setMarketSummary(m);
      setPortfolioSummary(p);
      if (isAuthenticated) {
        const notifs = await fetchNotifications(10);
        setUnreadNotifCount(notifs.unread_count || 0);
      }
    } catch (e) {
      console.error('Refresh error:', e);
    }
  };

  const handleAddTransactionSubmit = async (tx: Partial<Transaction>) => {
    try {
      const updated = await addTransaction(tx);
      setPortfolioSummary(updated);
    } catch (e: unknown) {
      console.error('Add transaction error:', e);
      if (e instanceof Error) {
        alert(e.message);
      }
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteTransaction(id);
      const updated = await fetchPortfolioSummary();
      setPortfolioSummary(updated);
    } catch (e) {
      console.error('Delete transaction error:', e);
    }
  };

  const handleResetPortfolio = async () => {
    try {
      const updated = await resetPortfolio();
      setPortfolioSummary(updated);
    } catch (e) {
      console.error('Reset portfolio error:', e);
    }
  };

  const handleSelectAsset = (assetId: string) => {
    setSelectedAssetId(assetId);
    setActiveTab('chart');
  };

  const filteredAssets = useMemo(() => {
    if (!marketSummary) return [];
    if (!searchQuery.trim()) return marketSummary.all_assets;
    const q = searchQuery.toLowerCase();
    return marketSummary.all_assets.filter(
      (a) => a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
    );
  }, [marketSummary, searchQuery]);

  return (
    <div
      className="app-container"
      style={{
        maxWidth: isMobilePreview ? 430 : '100%',
        margin: isMobilePreview ? '24px auto' : '0 auto',
        border: isMobilePreview ? '2px solid #3F3F46' : 'none',
        borderRadius: isMobilePreview ? 16 : 0,
        minHeight: isMobilePreview ? 860 : '100vh',
        overflow: 'hidden',
        backgroundColor: '#09090B',
        position: 'relative',
      }}
    >
      {/* Active Toast Notification */}
      {activeToast && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 2000,
            backgroundColor: '#18181B',
            border: `1px solid ${
              activeToast.type === 'VOLATILITY'
                ? '#F59E0B'
                : activeToast.type === 'TRANSACTION'
                ? '#10B981'
                : '#00E5FF'
            }`,
            padding: '16px 20px',
            borderRadius: 12,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            maxWidth: 380,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {activeToast.type === 'VOLATILITY' ? (
            <AlertCircle size={22} color="#F59E0B" />
          ) : activeToast.type === 'TRANSACTION' ? (
            <DollarSign size={22} color="#10B981" />
          ) : (
            <TrendingUp size={22} color="#00E5FF" />
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#FAFAFA' }}>
              {activeToast.title}
            </div>
            <div style={{ fontSize: '12px', color: '#A1A1AA', marginTop: 2, lineHeight: 1.4 }}>
              {activeToast.message}
            </div>
          </div>
          <button
            onClick={() => setActiveToast(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              marginLeft: 8,
              color: '#A1A1AA',
              padding: 4,
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 1. Header with Auth & Notification support */}
      <Header
        isConnected={isConnected}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAddModal={() => setIsModalOpen(true)}
        onOpenAlertModal={() => setIsAlertModalOpen(true)}
        isMobilePreview={isMobilePreview}
        onToggleMobilePreview={() => setIsMobilePreview(!isMobilePreview)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onRefresh={handleRefresh}
        unreadNotifCount={unreadNotifCount}
        onOpenNotifModal={() => setIsNotifModalOpen(true)}
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
      />

      {/* 2. Realtime Ticker Ribbon */}
      <TickerBar summary={marketSummary} onSelectAsset={handleSelectAsset} />

      {/* 3. Main Workspace */}
      <main className="main-content">
        {activeTab === 'portfolio' && (
          <PortfolioTab
            portfolio={portfolioSummary}
            onSelectAsset={handleSelectAsset}
            onDeleteTransaction={handleDeleteTransaction}
            onResetPortfolio={handleResetPortfolio}
            onOpenAddModal={() => setIsModalOpen(true)}
          />
        )}

        {activeTab === 'market' && (
          <MarketTab
            summary={marketSummary}
            onSelectAsset={handleSelectAsset}
          />
        )}

        {activeTab === 'chart' && (
          <ChartTab
            selectedAssetId={selectedAssetId}
            onSelectAsset={setSelectedAssetId}
            allAssets={filteredAssets}
          />
        )}

        {activeTab === 'forecast' && (
          <ForecastTab
            selectedAssetId={selectedAssetId}
            onSelectAsset={setSelectedAssetId}
            allAssets={filteredAssets}
          />
        )}
      </main>

      {/* 4. Mobile Bottom Navigation */}
      {(isMobile || isMobilePreview) && (
        <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
      )}

      {/* 5. Modals */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddTransactionSubmit}
        allAssets={marketSummary?.all_assets || []}
      />

      <PriceAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        allAssets={marketSummary?.all_assets || []}
      />

      <AuthModal
        onSuccess={() => {
          handleRefresh();
        }}
      />

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      <NotificationModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        onUnreadCountChange={setUnreadNotifCount}
      />

      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <CurrencyProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </CurrencyProvider>
    </LanguageProvider>
  );
};

export default App;
