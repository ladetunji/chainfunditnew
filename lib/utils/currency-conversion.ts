// Currency conversion utility for Nigerian users
// This provides approximate conversion rates (should be updated with real-time rates in production)

export interface CurrencyRates {
  [key: string]: number; // Rate to NGN
}

// Approximate conversion rates to Nigerian Naira (NGN)
// These should be updated with real-time rates from a currency API in production
export const CURRENCY_RATES_TO_NGN: CurrencyRates = {
  'NGN': 1,           // Nigerian Naira (base currency)
  'USD': 1500,        // US Dollar to Naira (approximate)
  'EUR': 1650,        // Euro to Naira (approximate)
  'GBP': 1900,        // British Pound to Naira (approximate)
  'CAD': 1100,        // Canadian Dollar to Naira (approximate)
  'AUD': 1000,        // Australian Dollar to Naira (approximate)
  'GHS': 120,         // Ghanaian Cedi to Naira (approximate)
  'KES': 10,          // Kenyan Shilling to Naira (approximate)
  'ZAR': 80,          // South African Rand to Naira (approximate)
  'EGP': 50,          // Egyptian Pound to Naira (approximate)
};

export function convertToNaira(amount: number, fromCurrency: string): number {
  const rate = CURRENCY_RATES_TO_NGN[fromCurrency.toUpperCase()] || 1;
  return amount * rate;
}

export function convertFromNaira(amount: number, toCurrency: string): number {
  const rate = CURRENCY_RATES_TO_NGN[toCurrency.toUpperCase()] || 1;
  return amount / rate;
}

export function getCurrencyRate(fromCurrency: string, toCurrency: string = 'NGN'): number {
  if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
    return 1;
  }
  
  const fromRate = CURRENCY_RATES_TO_NGN[fromCurrency.toUpperCase()] || 1;
  const toRate = CURRENCY_RATES_TO_NGN[toCurrency.toUpperCase()] || 1;
  
  return fromRate / toRate;
}

export function formatCurrencyWithConversion(
  amount: number, 
  currency: string, 
  showConversion: boolean = true,
  targetCurrency: string = 'NGN'
): string {
  const convertedAmount = convertToNaira(amount, currency);
  
  if (currency.toUpperCase() === targetCurrency.toUpperCase()) {
    return `₦${amount.toLocaleString()}`;
  }
  
  if (showConversion) {
    return `₦${convertedAmount.toLocaleString()} (${currency.toUpperCase()} ${amount.toLocaleString()})`;
  }
  
  return `₦${convertedAmount.toLocaleString()}`;
}

// Function to get real-time exchange rates (for future implementation)
export async function getRealTimeRates(): Promise<CurrencyRates> {
  // In production, this would fetch from a real currency API like:
  // - https://api.exchangerate-api.com/v4/latest/USD
  // - https://api.fixer.io/latest
  // - https://api.currencylayer.com/live
  
  // For now, return the static rates
  return CURRENCY_RATES_TO_NGN;
}
