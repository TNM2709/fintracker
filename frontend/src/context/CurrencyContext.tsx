import React, { useState, useMemo } from 'react';
import {
  type Currency,
  type GoldUnit,
  CurrencyContext,
} from './useCurrency';

export type { Currency, GoldUnit, CurrencyContextType } from './useCurrency';

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
