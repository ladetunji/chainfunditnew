import { useState } from 'react';

export interface DonationStatusResult {
  success: boolean;
  donationId?: string;
  status?: 'pending' | 'completed' | 'failed';
  wasUpdated?: boolean;
  message?: string;
  error?: string;
  donation?: {
    id: string;
    amount: string;
    currency: string;
    paymentStatus: string;
    createdAt: string;
    processedAt?: string;
  };
}

export function useDonationStatus() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkDonationStatus = async (donationId: string): Promise<DonationStatusResult> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/donations/status?donationId=${donationId}`);
      const result = await response.json();

      if (!result.success) {
        setError(result.error);
        return { success: false, error: result.error };
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check donation status';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const refreshDonationStatus = async (donationId: string): Promise<DonationStatusResult> => {
    // Same as checkDonationStatus but with explicit refresh intent
    return checkDonationStatus(donationId);
  };

  return {
    loading,
    error,
    checkDonationStatus,
    refreshDonationStatus,
  };
}
