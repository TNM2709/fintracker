import { createContext, useContext } from 'react';

export type Currency = 'VND' | 'USD';
export type GoldUnit = 'LUONG' | 'CHI' | 'OUNCE';

export interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  goldUnit: GoldUnit;
  setGoldUnit: (u: GoldUnit) => void;
  usdVndRate: number;
  setUsdVndRate: (r: number) => void;
  formatMoney: (amountVnd: number, forceCurrency?: Currency) => string;
  formatGoldPrice: (pricePerLuongVnd: number) => { text: string; unitLabel: string };
}

export const CurrencyContext = createContext<CurrencyContextType | null>(null);

export const useCurrency = (): CurrencyContextType => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return ctx;
};
