import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  typescript: true,
});

/**
 * Create a payment intent for Stripe payments
 */
export async function createStripePaymentIntent(
  amount: number,
  currency: string,
  metadata: Record<string, string>
) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return paymentIntent;
  } catch (error) {
    console.error('Error creating Stripe payment intent:', error);
    throw error;
  }
}

/**
 * Confirm a payment intent
 */
export async function confirmStripePayment(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error('Error confirming Stripe payment:', error);
    throw error;
  }
}

/**
 * Retrieve a payment intent
 */
export async function getStripePaymentIntent(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error('Error retrieving Stripe payment intent:', error);
    throw error;
  }
}

/**
 * Create a refund for a payment
 */
export async function createStripeRefund(paymentIntentId: string, amount?: number) {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
    });
    return refund;
  } catch (error) {
    console.error('Error creating Stripe refund:', error);
    throw error;
  }
}

/**
 * Verify Stripe webhook signature
 */
export function verifyStripeWebhook(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set');
  }

  try {
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    return event;
  } catch (error) {
    console.error('Error verifying Stripe webhook:', error);
    throw error;
  }
}

/**
 * Create a Stripe Connect account for payouts
 */
export async function createStripeConnectAccount(
  email: string,
  country: string = 'US',
  type: 'express' | 'standard' = 'express'
) {
  try {
    const account = await stripe.accounts.create({
      type,
      country,
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    return account;
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    throw error;
  }
}

/**
 * Create account link for Stripe Connect onboarding
 */
export async function createStripeAccountLink(
  accountId: string,
  refreshUrl: string,
  returnUrl: string
) {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    return accountLink;
  } catch (error) {
    console.error('Error creating Stripe account link:', error);
    throw error;
  }
}

/**
 * Create a payout to a Stripe Connect account
 */
export async function createStripePayout(
  amount: number,
  currency: string,
  destinationAccountId: string,
  description: string,
  metadata?: Record<string, string>
) {
  try {
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      destination: destinationAccountId,
      description,
      metadata,
    });

    return transfer;
  } catch (error) {
    console.error('Error creating Stripe payout:', error);
    throw error;
  }
}

/**
 * Get Stripe Connect account details
 */
export async function getStripeConnectAccount(accountId: string) {
  try {
    const account = await stripe.accounts.retrieve(accountId);
    return account;
  } catch (error) {
    console.error('Error retrieving Stripe Connect account:', error);
    throw error;
  }
}

/**
 * Check if Stripe Connect account is ready for payouts
 */
export async function isStripeAccountReadyForPayouts(accountId: string): Promise<boolean> {
  try {
    const account = await getStripeConnectAccount(accountId);
    
    return (
      account.charges_enabled &&
      account.payouts_enabled &&
      account.details_submitted &&
      !account.requirements?.disabled_reason
    );
  } catch (error) {
    console.error('Error checking Stripe account readiness:', error);
    return false;
  }
}

/**
 * Create a payout to an external bank account (for foreign currencies)
 * This uses Stripe's Payouts API to send funds directly to a bank account
 */
export async function createStripeBankAccountPayout(
  amount: number,
  currency: string,
  bankAccountDetails: {
    accountNumber: string;
    routingNumber?: string; // For US accounts
    sortCode?: string; // For UK accounts
    iban?: string; // For European accounts
    swiftBic?: string; // SWIFT/BIC code
    country: string; // Country code (US, GB, etc.)
    accountHolderName: string;
    bankName?: string;
  },
  description: string,
  metadata?: Record<string, string>
) {
  try {
    // First, create an external account (bank account) on the platform
    // For international payouts, we'll use Stripe's bank account tokenization
    // or create an external account directly
    
    // Create a bank account token or external account
    // Note: In production, you might want to use Stripe Elements or collect bank details securely
    // For now, we'll create an external account directly
    
    // Create payout to external bank account
    // Stripe requires creating an external account first, then creating a payout
    const payout = await stripe.payouts.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      description,
      metadata,
      // For international payouts, we need to create an external account first
      // This is a simplified version - in production, you'd want to:
      // 1. Create/retrieve external account
      // 2. Create payout to that external account
    });

    return payout;
  } catch (error) {
    console.error('Error creating Stripe bank account payout:', error);
    throw error;
  }
}

/**
 * Create or retrieve an external bank account for payouts
 * This creates a bank account that can be used for payouts on the platform account
 * Note: Stripe requires external accounts to be created before payouts can be made
 */
export async function createStripeExternalBankAccount(
  bankAccountDetails: {
    accountNumber: string;
    routingNumber?: string;
    sortCode?: string;
    iban?: string;
    swiftBic?: string;
    country: string;
    accountHolderName: string;
    accountHolderType?: 'individual' | 'company';
    currency?: string;
  }
) {
  try {
    // For platform account payouts, we need to create external accounts
    // Stripe's API structure for creating external accounts on platform account
    // We'll use the bank account tokenization approach or create external accounts directly
    
    // Build bank account object based on country
    const bankAccountParams: any = {
      object: 'bank_account',
      country: bankAccountDetails.country.toLowerCase(),
      currency: (bankAccountDetails.currency || 'usd').toLowerCase(),
      account_holder_name: bankAccountDetails.accountHolderName,
      account_holder_type: bankAccountDetails.accountHolderType || 'individual',
    };

    // US accounts use routing_number
    if (bankAccountDetails.routingNumber) {
      bankAccountParams.routing_number = bankAccountDetails.routingNumber;
      bankAccountParams.account_number = bankAccountDetails.accountNumber;
    }
    // UK accounts use sort_code
    else if (bankAccountDetails.sortCode) {
      bankAccountParams.sort_code = bankAccountDetails.sortCode;
      bankAccountParams.account_number = bankAccountDetails.accountNumber;
    }
    // European accounts use IBAN
    else if (bankAccountDetails.iban) {
      bankAccountParams.account_number = bankAccountDetails.iban;
    }
    // Fallback to account number
    else {
      bankAccountParams.account_number = bankAccountDetails.accountNumber;
    }

    // Create external account on platform account
    // Note: This requires the platform account to have payouts enabled
    // In production, you might want to store and reuse external account IDs
    const externalAccount = await stripe.accounts.createExternalAccount(
      'acct_default', // This should be your platform account ID
      {
        external_account: bankAccountParams,
      }
    );

    return externalAccount;
  } catch (error) {
    console.error('Error creating Stripe external bank account:', error);
    throw error;
  }
}

/**
 * Create a payout to an external bank account using external account ID
 */
export async function createStripePayoutToExternalAccount(
  amount: number,
  currency: string,
  externalAccountId: string,
  description: string,
  metadata?: Record<string, string>
) {
  try {
    const payout = await stripe.payouts.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      destination: externalAccountId,
      description,
      metadata,
    });

    return payout;
  } catch (error) {
    console.error('Error creating Stripe payout to external account:', error);
    throw error;
  }
}
