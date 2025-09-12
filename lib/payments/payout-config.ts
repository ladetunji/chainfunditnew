import { PaymentProvider } from './config';

// Payout provider types
export type PayoutProvider = 'stripe' | 'paystack';

// Currency to payout provider mapping (intelligent routing)
export const PAYOUT_PROVIDER_MAPPING: Record<string, PayoutProvider> = {
  // International currencies → Stripe Connect
  'USD': 'stripe',
  'EUR': 'stripe', 
  'GBP': 'stripe',
  'CAD': 'stripe',
  'AUD': 'stripe',
  'CHF': 'stripe',
  'JPY': 'stripe',
  'SGD': 'stripe',
  'HKD': 'stripe',
  'NZD': 'stripe',
  
  // African currencies → Paystack Transfers
  'NGN': 'paystack',
  'GHS': 'paystack',
  'ZAR': 'paystack',
  'KES': 'paystack',
};

// Payout provider configurations
export const PAYOUT_CONFIG = {
  stripe: {
    name: 'Stripe Connect',
    description: 'Direct bank transfer to your account',
    supportedCountries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI'],
    minPayoutAmount: 1.00, // $1 minimum
    processingTime: '2-7 business days',
    fees: '2.9% + 30¢ per transaction',
  },
  paystack: {
    name: 'Paystack Transfers',
    description: 'Direct bank transfer to Nigerian bank account',
    supportedCountries: ['NG'],
    minPayoutAmount: 100.00, // ₦100 minimum
    processingTime: '1-3 business days',
    fees: '1.5% + ₦50 per transaction',
  },
};

// Get the recommended payout provider for a currency
export function getPayoutProvider(currency: string): PayoutProvider | null {
  return PAYOUT_PROVIDER_MAPPING[currency] || null;
}

// Get payout configuration for a provider
export function getPayoutConfig(provider: PayoutProvider) {
  return PAYOUT_CONFIG[provider];
}

// Check if a currency is supported for payouts
export function isPayoutSupported(currency: string): boolean {
  return currency in PAYOUT_PROVIDER_MAPPING;
}

// Get all supported currencies for payouts
export function getSupportedPayoutCurrencies(): string[] {
  return Object.keys(PAYOUT_PROVIDER_MAPPING);
}
