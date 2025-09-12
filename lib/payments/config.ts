import Stripe from 'stripe';

// Stripe Configuration
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// Paystack Configuration
export const paystackConfig = {
  secretKey: process.env.PAYSTACK_SECRET_KEY!,
  publicKey: process.env.PAYSTACK_PUBLIC_KEY!,
  baseUrl: 'https://api.paystack.co',
};

// Payment Provider Types
export type PaymentProvider = 'stripe' | 'paystack';

// Currency support by provider
export const CURRENCY_SUPPORT: Record<PaymentProvider, string[]> = {
  stripe: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CHF', 'JPY', 'SGD', 'HKD', 'NZD'],
  paystack: ['NGN', 'USD', 'GHS', 'ZAR', 'KES'],
};

// Preferred provider for each currency (for intelligent routing)
export const PREFERRED_PROVIDER: Record<string, PaymentProvider> = {
  // International currencies → Stripe
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
  
  // African currencies → Paystack
  'NGN': 'paystack',
  'GHS': 'paystack',
  'ZAR': 'paystack',
  'KES': 'paystack',
};

// Provider descriptions for UI
export const PROVIDER_DESCRIPTIONS: Record<PaymentProvider, string> = {
  stripe: 'Credit/Debit Card, Apple Pay, Google Pay',
  paystack: 'Bank Transfer, Card, USSD',
};

// Get supported payment providers for a currency
export function getSupportedProviders(currency: string): PaymentProvider[] {
  const providers: PaymentProvider[] = [];
  
  if (CURRENCY_SUPPORT.stripe.includes(currency)) {
    providers.push('stripe');
  }
  
  if (CURRENCY_SUPPORT.paystack.includes(currency)) {
    providers.push('paystack');
  }
  
  return providers;
}

// Get the preferred provider for a currency (intelligent routing)
export function getPreferredProvider(currency: string): PaymentProvider | null {
  return PREFERRED_PROVIDER[currency] || null;
}

// Get intelligent provider recommendations for a currency
export function getIntelligentProviders(currency: string): {
  primary: PaymentProvider | null;
  alternatives: PaymentProvider[];
} {
  const primary = getPreferredProvider(currency);
  const allSupported = getSupportedProviders(currency);
  const alternatives = allSupported.filter(provider => provider !== primary);
  
  return {
    primary,
    alternatives
  };
}

// Environment validation
export function validatePaymentConfig() {
  const errors: string[] = [];
  
  if (!process.env.STRIPE_SECRET_KEY) {
    errors.push('Missing STRIPE_SECRET_KEY environment variable');
  }
  
  if (!process.env.PAYSTACK_SECRET_KEY) {
    errors.push('Missing PAYSTACK_SECRET_KEY environment variable');
  }
  
  if (errors.length > 0) {
    throw new Error(`Payment configuration errors:\n${errors.join('\n')}`);
  }
}
