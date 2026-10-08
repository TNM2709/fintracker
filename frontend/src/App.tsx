import React, { useEffect, useState, useMemo } from 'react';
import type { MarketSummary, PortfolioSummary, Transaction, PriceAlert } from './types';
import {
  fetchMarketSummary,
  fetchPortfolioSummary,
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
import { MobileNav } from './components/MobileNav';
import { CurrencyProvider, useCurrency } from './context/CurrencyContext';
import { Bell, X } from 'lucide-react';

const MainApp: React.FC = () => {
  const { setUsdVndRate } = useCurrency();
  const [activeTab, setActiveTab] = useState<string>('portfolio');
  const [selectedAssetId, setSelectedAssetId] = useState<string>('XAU-SJC');
  const [isMobilePreview, setIsMobilePreview] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState<boolean>(false);

  const [marketSummary, setMarketSummary] = useState<MarketSummary | null>(null);
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeToast, setActiveToast] = useState<PriceAlert | null>(null);

  // Initialize Data & WebSocket Connection
  useEffect(() => {
    fetchMarketSummary()
      .then((data) => {
        setMarketSummary(data);
        if (data.usd_vnd_exchange) setUsdVndRate(data.usd_vnd_exchange);
      })
      .catch((err) => console.error('Initial market fetch error:', err));

    fetchPortfolioSummary()
      .then((data) => setPortfolioSummary(data))
      .catch((err) => console.error('Initial portfolio fetch error:', err));

    // Realtime WebSocket Stream from Go Backend
    const client = new RealtimeTickerClient();
    const unsubTicker = client.onUpdate((summary) => {
      setMarketSummary(summary);
      if (summary.usd_vnd_exchange) setUsdVndRate(summary.usd_vnd_exchange);
      setIsConnected(true);
    });

    // Lắng nghe cảnh báo giá chạm ngưỡng realtime
    const unsubAlert = client.onAlertTrigger((alert) => {
      setActiveToast(alert);
      setTimeout(() => setActiveToast(null), 8000); // Ẩn sau 8 giây
    });

    const checkInterval = setInterval(() => {
      setIsConnected(client.getStatus());
    }, 2000);

    return () => {
      unsubTicker();
      unsubAlert();
      clearInterval(checkInterval);
    };
  }, []);

  const handleRefresh = async () => {
    try {
      const [m, p] = await Promise.all([fetchMarketSummary(), fetchPortfolioSummary()]);
      setMarketSummary(m);
      setPortfolioSummary(p);
    } catch (e) {
      console.error('Refresh error:', e);
    }
  };

  const handleAddTransactionSubmit = async (tx: Partial<Transaction>) => {
    try {
      const updated = await addTransaction(tx);
      setPortfolioSummary(updated);
    } catch (e) {
      console.error('Add transaction error:', e);
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
    <div className="app-container" style={{
      maxWidth: isMobilePreview ? 430 : '100%',
      margin: isMobilePreview ? '20px auto' : '0 auto',
      border: isMobilePreview ? '8px solid #1e293b' : 'none',
      borderRadius: isMobilePreview ? 40 : 0,
      boxShadow: isMobilePreview ? '0 25px 60px -15px rgba(0, 0, 0, 0.9)' : 'none',
      minHeight: isMobilePreview ? 860 : '100vh',
      overflow: 'hidden',
      background: 'var(--bg-primary)',
      position: 'relative',
    }}>
      {/* Toast Notification Khi Cảnh Báo Giá Chạm Ngưỡng */}
      {activeToast && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 2000,
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.95) 0%, rgba(217, 119, 6, 0.95) 100%)',
          color: '#070a13',
          padding: '14px 20px',
          borderRadius: 12,
          boxShadow: '0 10px 30px rgba(245, 158, 11, 0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          animation: 'fadeIn 0.3s ease',
        }}>
          <Bell size={20} color="#070a13" />
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>
              CẢNH BÁO GIÁ: {activeToast.symbol}
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
              Đã chạm ngưỡng {activeToast.condition === 'ABOVE' ? '≥' : '≤'} {activeToast.target_price.toLocaleString()}!
            </div>
          </div>
          <button
            onClick={() => setActiveToast(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 8 }}
          >
            <X size={16} color="#070a13" />
          </button>
        </div>
      )}

      {/* 1. Header */}
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
      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />

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
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <CurrencyProvider>
      <MainApp />
    </CurrencyProvider>
  );
};

export default App;

