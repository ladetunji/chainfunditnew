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
  stripe: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
  paystack: ['NGN', 'USD', 'GHS', 'ZAR', 'KES'],
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
