import React, { createContext, useContext, useState, useMemo } from 'react';

export type Currency = 'VND' | 'USD';
export type GoldUnit = 'LUONG' | 'CHI' | 'OUNCE';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  goldUnit: GoldUnit;
  setGoldUnit: (u: GoldUnit) => void;
  usdVndRate: number;
  setUsdVndRate: (r: number) => void;
  formatMoney: (amountVnd: number, forceCurrency?: Currency) => string;
  formatGoldPrice: (pricePerLuongVnd: number) => { text: string; unitLabel: string };
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export const CurrencyProvider: React.FC<{ children: React.ReactNode; initialRate?: number }> = ({
  children,
  initialRate = 25450,
}) => {
  const [currency, setCurrency] = useState<Currency>('VND');
  const [goldUnit, setGoldUnit] = useState<GoldUnit>('LUONG');
  const [usdVndRate, setUsdVndRate] = useState<number>(initialRate);

  const formatMoney = useMemo(() => {
    return (amountVnd: number, forceCurrency?: Currency): string => {
      const activeCurr = forceCurrency || currency;
      if (activeCurr === 'USD') {
        const usd = amountVnd / (usdVndRate || 25450);
        return `$${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      return `${Math.round(amountVnd).toLocaleString('vi-VN')} ₫`;
    };
  }, [currency, usdVndRate]);

  const formatGoldPrice = useMemo(() => {
    return (pricePerLuongVnd: number): { text: string; unitLabel: string } => {
      let unitPriceVnd = pricePerLuongVnd;
      let unitLabel = 'Lượng (Cây)';

      if (goldUnit === 'CHI') {
        unitPriceVnd = pricePerLuongVnd / 10;
        unitLabel = 'Chỉ';
      } else if (goldUnit === 'OUNCE') {
        unitPriceVnd = pricePerLuongVnd * 0.829426; // 1 oz = 0.829426 lượng
        unitLabel = 'Ounce (oz)';
      }

      if (currency === 'USD') {
        const usd = unitPriceVnd / (usdVndRate || 25450);
        return {
          text: `$${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          unitLabel,
        };
      }

      return {
        text: `${Math.round(unitPriceVnd).toLocaleString('vi-VN')} ₫`,
        unitLabel,
      };
    };
  }, [currency, goldUnit, usdVndRate]);

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        goldUnit,
        setGoldUnit,
        usdVndRate,
        setUsdVndRate,
        formatMoney,
        formatGoldPrice,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return ctx;
};
