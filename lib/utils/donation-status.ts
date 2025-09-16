/**
 * Enhanced donation status criteria and logic
 */

export interface DonationStatusCriteria {
  id: string;
  amount: number | string; // Can be number or string from database
  currency: string;
  paymentStatus: string; // Flexible to accept any string from database
  paymentMethod: string;
  paymentProvider?: string;
  createdAt: string | Date; // Can be string or Date from database
  processedAt?: string | Date | null;
  retryAttempts?: number;
  failureReason?: string | null;
  lastStatusUpdate?: string | Date | null;
}

export const DONATION_STATUS_CONFIG = {
  // Time-based criteria (in milliseconds)
  PENDING_MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days
  RETRY_COOLDOWN: 24 * 60 * 60 * 1000, // 24 hours between retries
  
  // Retry limits
  MAX_RETRY_ATTEMPTS: 3,
  
  // Payment provider specific states
  STRIPE_PENDING_STATES: [
    'requires_payment_method',
    'requires_confirmation', 
    'requires_action',
    'processing'
  ],
  
  STRIPE_FAILED_STATES: [
    'payment_failed',
    'canceled',
    'requires_payment_method' // After max retries
  ],
  
  PAYSTACK_PENDING_STATES: [
    'pending',
    'processing'
  ],
  
  PAYSTACK_FAILED_STATES: [
    'failed',
    'reversed',
    'declined'
  ],
  
  // Failure reasons
  FAILURE_REASONS: {
    CARD_DECLINED: 'Card declined by bank',
    INSUFFICIENT_FUNDS: 'Insufficient funds',
    EXPIRED_CARD: 'Expired payment method',
    INVALID_DETAILS: 'Invalid payment details',
    FRAUD_DETECTED: 'Fraud detection triggered',
    TIMEOUT: 'Payment timeout - no response',
    BANK_ERROR: 'Bank processing error',
    CURRENCY_ERROR: 'Currency conversion failed',
    ACCOUNT_RESTRICTED: 'Account restrictions',
    MAX_RETRIES: 'Maximum retry attempts exceeded',
    USER_CANCELLED: 'User cancelled payment',
    TECHNICAL_ERROR: 'Technical processing error'
  }
} as const;

/**
 * Determines if a donation should be considered pending
 */
export function isDonationPending(donation: DonationStatusCriteria): boolean {
  const now = new Date();
  const createdAt = new Date(donation.createdAt);
  const ageInMs = now.getTime() - createdAt.getTime();
  
  // If already completed, not pending
  if (donation.paymentStatus === 'completed') {
    return false;
  }
  
  // If explicitly failed and not retryable, not pending
  if (donation.paymentStatus === 'failed' && !isRetryable(donation)) {
    return false;
  }
  
  // Check age-based criteria
  if (ageInMs > DONATION_STATUS_CONFIG.PENDING_MAX_AGE) {
    return false; // Too old, should be failed
  }
  
  // Check retry attempts
  const retryAttempts = donation.retryAttempts || 0;
  if (retryAttempts >= DONATION_STATUS_CONFIG.MAX_RETRY_ATTEMPTS) {
    return false; // Max retries exceeded
  }
  
  // If status is pending or we're within retry window, it's pending
  return donation.paymentStatus === 'pending' || 
         (donation.paymentStatus === 'failed' && isRetryable(donation));
}

/**
 * Determines if a donation should be considered failed
 */
export function isDonationFailed(donation: DonationStatusCriteria): boolean {
  // If explicitly failed
  if (donation.paymentStatus === 'failed') {
    return true;
  }
  
  // If too old and still pending
  const now = new Date();
  const createdAt = new Date(donation.createdAt);
  const ageInMs = now.getTime() - createdAt.getTime();
  
  if (ageInMs > DONATION_STATUS_CONFIG.PENDING_MAX_AGE) {
    return true;
  }
  
  // If max retries exceeded
  const retryAttempts = donation.retryAttempts || 0;
  if (retryAttempts >= DONATION_STATUS_CONFIG.MAX_RETRY_ATTEMPTS) {
    return true;
  }
  
  return false;
}

/**
 * Determines if a failed donation can be retried
 */
export function isRetryable(donation: DonationStatusCriteria): boolean {
  // Can't retry completed donations
  if (donation.paymentStatus === 'completed') {
    return false;
  }
  
  // Check retry attempts
  const retryAttempts = donation.retryAttempts || 0;
  if (retryAttempts >= DONATION_STATUS_CONFIG.MAX_RETRY_ATTEMPTS) {
    return false;
  }
  
  // Check cooldown period
  const lastUpdate = donation.lastStatusUpdate || donation.createdAt;
  const now = new Date();
  const lastUpdateTime = new Date(lastUpdate);
  const timeSinceLastUpdate = now.getTime() - lastUpdateTime.getTime();
  
  if (timeSinceLastUpdate < DONATION_STATUS_CONFIG.RETRY_COOLDOWN) {
    return false; // Still in cooldown
  }
  
  // Check if failure reason is retryable
  const retryableReasons: string[] = [
    DONATION_STATUS_CONFIG.FAILURE_REASONS.CARD_DECLINED,
    DONATION_STATUS_CONFIG.FAILURE_REASONS.INSUFFICIENT_FUNDS,
    DONATION_STATUS_CONFIG.FAILURE_REASONS.TIMEOUT,
    DONATION_STATUS_CONFIG.FAILURE_REASONS.BANK_ERROR,
    DONATION_STATUS_CONFIG.FAILURE_REASONS.TECHNICAL_ERROR
  ];
  
  const nonRetryableReasons: string[] = [
    DONATION_STATUS_CONFIG.FAILURE_REASONS.EXPIRED_CARD,
    DONATION_STATUS_CONFIG.FAILURE_REASONS.INVALID_DETAILS,
    DONATION_STATUS_CONFIG.FAILURE_REASONS.FRAUD_DETECTED,
    DONATION_STATUS_CONFIG.FAILURE_REASONS.ACCOUNT_RESTRICTED,
    DONATION_STATUS_CONFIG.FAILURE_REASONS.USER_CANCELLED
  ];
  
  if (donation.failureReason) {
    if (nonRetryableReasons.includes(donation.failureReason)) {
      return false;
    }
    return retryableReasons.includes(donation.failureReason);
  }
  
  return true; // Default to retryable if no specific reason
}

/**
 * Gets the appropriate failure reason based on payment provider response
 */
export function getFailureReason(
  provider: string, 
  providerStatus: string, 
  providerError?: string
): string {
  const error = providerError?.toLowerCase() || '';
  const status = providerStatus.toLowerCase();
  
  // Provider-specific error mapping
  if (provider === 'stripe') {
    if (status === 'payment_failed') {
      if (error.includes('card_declined')) return DONATION_STATUS_CONFIG.FAILURE_REASONS.CARD_DECLINED;
      if (error.includes('insufficient_funds')) return DONATION_STATUS_CONFIG.FAILURE_REASONS.INSUFFICIENT_FUNDS;
      if (error.includes('expired_card')) return DONATION_STATUS_CONFIG.FAILURE_REASONS.EXPIRED_CARD;
      if (error.includes('fraud')) return DONATION_STATUS_CONFIG.FAILURE_REASONS.FRAUD_DETECTED;
      if (error.includes('invalid')) return DONATION_STATUS_CONFIG.FAILURE_REASONS.INVALID_DETAILS;
    }
    if (status === 'canceled') return DONATION_STATUS_CONFIG.FAILURE_REASONS.USER_CANCELLED;
  }
  
  if (provider === 'paystack') {
    if (status === 'failed') {
      if (error.includes('insufficient')) return DONATION_STATUS_CONFIG.FAILURE_REASONS.INSUFFICIENT_FUNDS;
      if (error.includes('declined')) return DONATION_STATUS_CONFIG.FAILURE_REASONS.CARD_DECLINED;
      if (error.includes('expired')) return DONATION_STATUS_CONFIG.FAILURE_REASONS.EXPIRED_CARD;
      if (error.includes('fraud')) return DONATION_STATUS_CONFIG.FAILURE_REASONS.FRAUD_DETECTED;
    }
    if (status === 'reversed') return DONATION_STATUS_CONFIG.FAILURE_REASONS.BANK_ERROR;
  }
  
  // Default fallbacks
  if (error.includes('timeout')) return DONATION_STATUS_CONFIG.FAILURE_REASONS.TIMEOUT;
  if (error.includes('currency')) return DONATION_STATUS_CONFIG.FAILURE_REASONS.CURRENCY_ERROR;
  if (error.includes('restricted')) return DONATION_STATUS_CONFIG.FAILURE_REASONS.ACCOUNT_RESTRICTED;
  
  return DONATION_STATUS_CONFIG.FAILURE_REASONS.TECHNICAL_ERROR;
}

/**
 * Gets user-friendly status message
 */
export function getStatusMessage(donation: DonationStatusCriteria): string {
  if (donation.paymentStatus === 'completed') {
    return 'Payment completed successfully';
  }
  
  if (isDonationPending(donation)) {
    const retryAttempts = donation.retryAttempts || 0;
    if (retryAttempts > 0) {
      return `Payment pending - attempt ${retryAttempts + 1} of ${DONATION_STATUS_CONFIG.MAX_RETRY_ATTEMPTS}`;
    }
    return 'Payment pending - awaiting confirmation';
  }
  
  if (isDonationFailed(donation)) {
    if (donation.failureReason) {
      return `Payment failed - ${donation.failureReason.toLowerCase()}`;
    }
    return 'Payment failed - please try again';
  }
  
  return 'Payment status unknown';
}

/**
 * Gets the next retry time for a donation
 */
export function getNextRetryTime(donation: DonationStatusCriteria): Date | null {
  if (!isRetryable(donation)) {
    return null;
  }
  
  const lastUpdate = donation.lastStatusUpdate || donation.createdAt;
  const lastUpdateTime = new Date(lastUpdate);
  const nextRetryTime = new Date(lastUpdateTime.getTime() + DONATION_STATUS_CONFIG.RETRY_COOLDOWN);
  
  return nextRetryTime;
}
