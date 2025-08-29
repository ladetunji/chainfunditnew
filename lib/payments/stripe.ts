import { stripe } from './config';
import { Donation } from '@/lib/schema/donations';

export interface CreatePaymentIntentParams {
  amount: number; // Amount in cents
  currency: string;
  donationId: string;
  campaignId: string;
  donorEmail?: string;
  metadata?: Record<string, string>;
}

export interface StripePaymentResult {
  success: boolean;
  paymentIntentId?: string;
  clientSecret?: string;
  error?: string;
}

export async function createStripePaymentIntent(
  params: CreatePaymentIntentParams
): Promise<StripePaymentResult> {
  try {
    const { amount, currency, donationId, campaignId, donorEmail, metadata = {} } = params;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency.toLowerCase(),
      metadata: {
        donationId,
        campaignId,
        ...metadata,
      },
      receipt_email: donorEmail,
      description: `Donation for campaign ${campaignId}`,
    });

    return {
      success: true,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret!,
    };
  } catch (error) {
    console.error('Error creating Stripe payment intent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function confirmStripePayment(paymentIntentId: string): Promise<StripePaymentResult> {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    return {
      success: paymentIntent.status === 'succeeded',
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error('Error confirming Stripe payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function handleStripeWebhook(
  payload: string,
  signature: string
): Promise<{ success: boolean; event?: any; error?: string }> {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    return { success: true, event };
  } catch (error) {
    console.error('Error handling Stripe webhook:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Simulate a successful payment for testing
export async function simulateStripePayment(
  params: CreatePaymentIntentParams
): Promise<StripePaymentResult> {
  // In development, simulate successful payment
  if (process.env.NODE_ENV === 'development') {
    return {
      success: true,
      paymentIntentId: `pi_test_${Date.now()}`,
      clientSecret: `pi_test_${Date.now()}_secret_test`,
    };
  }
  
  return createStripePaymentIntent(params);
}
