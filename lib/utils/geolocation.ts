/**
 * Geolocation and Currency Utilities
 * Handles user location detection and currency conversion
 */

// Country to currency mapping
const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  // Nigeria - can see all currencies
  'NG': 'NGN',
  'NGA': 'NGN',
  'NIGERIA': 'NGN',
  
  // UK - only see GBP
  'GB': 'GBP',
  'GBR': 'GBP',
  'UNITED KINGDOM': 'GBP',
  'UK': 'GBP',
  
  // US - only see USD
  'US': 'USD',
  'USA': 'USD',
  'UNITED STATES': 'USD',
  
  // Canada - only see CAD
  'CA': 'CAD',
  'CAN': 'CAD',
  'CANADA': 'CAD',
  
  // Eurozone countries - only see EUR
  'DE': 'EUR', // Germany
  'FR': 'EUR', // France
  'IT': 'EUR', // Italy
  'ES': 'EUR', // Spain
  'NL': 'EUR', // Netherlands
  'BE': 'EUR', // Belgium
  'AT': 'EUR', // Austria
  'FI': 'EUR', // Finland
  'IE': 'EUR', // Ireland
  'PT': 'EUR', // Portugal
  'GR': 'EUR', // Greece
  'LU': 'EUR', // Luxembourg
  'MT': 'EUR', // Malta
  'CY': 'EUR', // Cyprus
  'SI': 'EUR', // Slovenia
  'SK': 'EUR', // Slovakia
  'EE': 'EUR', // Estonia
  'LV': 'EUR', // Latvia
  'LT': 'EUR', // Lithuania
};

// Countries that can see all currencies (like Nigeria)
const ALL_CURRENCY_COUNTRIES = ['NG', 'NGA', 'NIGERIA'];

export interface GeolocationData {
  country: string;
  countryCode: string;
  currency: string;
  canSeeAllCurrencies: boolean;
}

export interface CurrencyConversion {
  from: string;
  to: string;
  amount: number;
  convertedAmount: number;
  rate: number;
  timestamp: number;
}

/**
 * Get user's geolocation data
 */
export async function getUserGeolocation(): Promise<GeolocationData | null> {
  try {
    // Try to get location from IP geolocation service
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    if (data.error) {
      console.warn('Geolocation API error:', data.reason);
      return getDefaultGeolocation();
    }
    
    const countryCode = data.country_code?.toUpperCase();
    const country = data.country_name?.toUpperCase();
    
    if (!countryCode || !country) {
      return getDefaultGeolocation();
    }
    
    const currency = COUNTRY_CURRENCY_MAP[countryCode] || COUNTRY_CURRENCY_MAP[country] || 'USD';
    const canSeeAllCurrencies = ALL_CURRENCY_COUNTRIES.includes(countryCode) || 
                               ALL_CURRENCY_COUNTRIES.includes(country);
    
    return {
      country: data.country_name,
      countryCode,
      currency,
      canSeeAllCurrencies,
    };
  } catch (error) {
    console.warn('Failed to get geolocation:', error);
    return getDefaultGeolocation();
  }
}

/**
 * Get default geolocation (Nigeria - can see all currencies)
 */
function getDefaultGeolocation(): GeolocationData {
  return {
    country: 'Nigeria',
    countryCode: 'NG',
    currency: 'NGN',
    canSeeAllCurrencies: true,
  };
}

/**
 * Check if a campaign currency should be visible to user
 */
export function shouldShowCampaignCurrency(
  campaignCurrency: string, 
  userGeolocation: GeolocationData
): boolean {
  // If user can see all currencies, show everything
  if (userGeolocation.canSeeAllCurrencies) {
    return true;
  }
  
  // Otherwise, only show campaigns in user's currency
  return campaignCurrency === userGeolocation.currency;
}

/**
 * Convert currency amount using exchange rates
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<CurrencyConversion | null> {
  try {
    // If same currency, no conversion needed
    if (fromCurrency === toCurrency) {
      return {
        from: fromCurrency,
        to: toCurrency,
        amount,
        convertedAmount: amount,
        rate: 1,
        timestamp: Date.now(),
      };
    }
    
    // Get exchange rates from API
    const rates = await getExchangeRates(fromCurrency);
    if (!rates) {
      return null;
    }
    
    const rate = rates[toCurrency];
    if (!rate) {
      console.warn(`Exchange rate not found for ${toCurrency}`);
      return null;
    }
    
    const convertedAmount = amount * rate;
    
    return {
      from: fromCurrency,
      to: toCurrency,
      amount,
      convertedAmount: Math.round(convertedAmount * 100) / 100, // Round to 2 decimal places
      rate,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Currency conversion error:', error);
    return null;
  }
}

/**
 * Get exchange rates from API
 */
async function getExchangeRates(baseCurrency: string): Promise<Record<string, number> | null> {
  try {
    // Using exchangerate-api.com (free tier) with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`, {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn(`Exchange rate API responded with status: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.rates) {
      console.warn('Exchange rate API returned invalid data structure');
      return null;
    }
    
    return data.rates;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('Exchange rate API request timed out');
    } else {
      console.warn('Failed to fetch exchange rates:', error);
    }
    return null;
  }
}

/**
 * Format amount with currency conversion
 */
export async function formatAmountWithConversion(
  amount: number,
  originalCurrency: string,
  userCurrency: string,
  userGeolocation: GeolocationData
): Promise<{ amount: number; currency: string; originalAmount?: number; originalCurrency?: string }> {
  // If user can see all currencies, show original
  if (userGeolocation.canSeeAllCurrencies) {
    return { amount, currency: originalCurrency };
  }
  
  // If same currency, no conversion needed
  if (originalCurrency === userCurrency) {
    return { amount, currency: originalCurrency };
  }
  
  // Convert to user's currency
  const conversion = await convertCurrency(amount, originalCurrency, userCurrency);
  if (!conversion) {
    // Fallback to original if conversion fails
    return { amount, currency: originalCurrency };
  }
  
  return {
    amount: conversion.convertedAmount,
    currency: userCurrency,
    originalAmount: amount,
    originalCurrency: originalCurrency,
  };
}

/**
 * Get supported currencies for a user based on their location
 */
export function getSupportedCurrencies(userGeolocation: GeolocationData): string[] {
  if (userGeolocation.canSeeAllCurrencies) {
    return ['NGN', 'USD', 'GBP', 'EUR', 'CAD'];
  }
  
  return [userGeolocation.currency];
}

/**
 * Check if a currency is supported for a user
 */
export function isCurrencySupported(currency: string, userGeolocation: GeolocationData): boolean {
  const supportedCurrencies = getSupportedCurrencies(userGeolocation);
  return supportedCurrencies.includes(currency);
}
