import { useState, useEffect, useCallback } from 'react';
import { 
  getUserGeolocation, 
  GeolocationData, 
  convertCurrency, 
  formatAmountWithConversion,
  shouldShowCampaignCurrency,
  isCurrencySupported,
  CurrencyConversion 
} from '@/lib/utils/geolocation';

export interface UseGeolocationReturn {
  geolocation: GeolocationData | null;
  loading: boolean;
  error: string | null;
  refreshLocation: () => Promise<void>;
}

export interface UseCurrencyConversionReturn {
  convertAmount: (amount: number, fromCurrency: string, toCurrency: string) => Promise<CurrencyConversion | null>;
  formatAmount: (amount: number, originalCurrency: string) => Promise<{ amount: number; currency: string; originalAmount?: number; originalCurrency?: string }>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for managing user geolocation
 */
export function useGeolocation(): UseGeolocationReturn {
  const [geolocation, setGeolocation] = useState<GeolocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshLocation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const location = await getUserGeolocation();
      setGeolocation(location);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshLocation();
  }, [refreshLocation]);

  return {
    geolocation,
    loading,
    error,
    refreshLocation,
  };
}

/**
 * Hook for currency conversion
 */
export function useCurrencyConversion(userGeolocation: GeolocationData | null): UseCurrencyConversionReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const convertAmount = useCallback(async (
    amount: number, 
    fromCurrency: string, 
    toCurrency: string
  ): Promise<CurrencyConversion | null> => {
    if (!userGeolocation) {
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      
      const conversion = await convertCurrency(amount, fromCurrency, toCurrency);
      return conversion;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, [userGeolocation]);

  const formatAmount = useCallback(async (
    amount: number, 
    originalCurrency: string
  ): Promise<{ amount: number; currency: string; originalAmount?: number; originalCurrency?: string }> => {
    if (!userGeolocation) {
      return { amount, currency: originalCurrency };
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await formatAmountWithConversion(
        amount, 
        originalCurrency, 
        userGeolocation.currency, 
        userGeolocation
      );
      
      return result;
    } catch (err) {
      // Don't set error for currency conversion failures - just fallback gracefully
      console.warn('Currency conversion failed, using original currency:', err);
      return { amount, currency: originalCurrency };
    } finally {
      setLoading(false);
    }
  }, [userGeolocation]);

  return {
    convertAmount,
    formatAmount,
    loading,
    error,
  };
}

/**
 * Hook for campaign filtering based on geolocation
 */
export function useCampaignFiltering(userGeolocation: GeolocationData | null) {
  const shouldShowCampaign = useCallback((campaignCurrency: string): boolean => {
    if (!userGeolocation) {
      return true; // Show all if no geolocation
    }
    
    return shouldShowCampaignCurrency(campaignCurrency, userGeolocation);
  }, [userGeolocation]);

  const isCurrencySupportedForUser = useCallback((currency: string): boolean => {
    if (!userGeolocation) {
      return true; // Support all if no geolocation
    }
    
    return isCurrencySupported(currency, userGeolocation);
  }, [userGeolocation]);

  return {
    shouldShowCampaign,
    isCurrencySupportedForUser,
  };
}
