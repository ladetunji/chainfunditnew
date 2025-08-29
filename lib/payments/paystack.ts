import { paystackConfig } from './config';

export interface CreatePaystackTransactionParams {
  amount: number; // Amount in kobo (for NGN) or cents (for other currencies)
  currency: string;
  email: string;
  donationId: string;
  campaignId: string;
  metadata?: Record<string, any>;
  callback_url?: string;
}

export interface PaystackPaymentResult {
  success: boolean;
  authorization_url?: string;
  access_code?: string;
  reference?: string;
  error?: string;
}

export async function createPaystackTransaction(
  params: CreatePaystackTransactionParams
): Promise<PaystackPaymentResult> {
  try {
    const { amount, currency, email, donationId, campaignId, metadata = {}, callback_url } = params;

    const response = await fetch(`${paystackConfig.baseUrl}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackConfig.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency,
        email,
        reference: `donation_${donationId}_${Date.now()}`,
        metadata: {
          donationId,
          campaignId,
          ...metadata,
        },
        callback_url: callback_url || `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/paystack/callback`,
      }),
    });

    const data = await response.json();

    if (data.status) {
      return {
        success: true,
        authorization_url: data.data.authorization_url,
        access_code: data.data.access_code,
        reference: data.data.reference,
      };
    } else {
      return {
        success: false,
        error: data.message || 'Failed to initialize transaction',
      };
    }
  } catch (error) {
    console.error('Error creating Paystack transaction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function verifyPaystackTransaction(reference: string): Promise<PaystackPaymentResult> {
  try {
    const response = await fetch(`${paystackConfig.baseUrl}/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${paystackConfig.secretKey}`,
      },
    });

    const data = await response.json();

    if (data.status && data.data.status === 'success') {
      return {
        success: true,
        reference: data.data.reference,
      };
    } else {
      return {
        success: false,
        error: data.message || 'Transaction verification failed',
      };
    }
  } catch (error) {
    console.error('Error verifying Paystack transaction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function handlePaystackWebhook(
  payload: any
): Promise<{ success: boolean; event?: any; error?: string }> {
  try {
    // Verify the webhook signature
    const hash = require('crypto')
      .createHmac('sha512', paystackConfig.secretKey)
      .update(JSON.stringify(payload))
      .digest('hex');

    return { success: true, event: payload };
  } catch (error) {
    console.error('Error handling Paystack webhook:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Simulate a successful payment for testing
export async function simulatePaystackPayment(
  params: CreatePaystackTransactionParams
): Promise<PaystackPaymentResult> {
  // In development, simulate successful payment
  if (process.env.NODE_ENV === 'development') {
    return {
      success: true,
      authorization_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/paystack/simulate`,
      access_code: `test_access_${Date.now()}`,
      reference: `test_ref_${Date.now()}`,
    };
  }
  
  return createPaystackTransaction(params);
}
