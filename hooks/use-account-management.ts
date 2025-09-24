import { useState, useEffect } from 'react';

interface Bank {
  id: number;
  name: string;
  code: string;
  longcode: string;
  gateway: string | null;
  pay_with_bank: boolean;
  active: boolean;
  is_deleted: boolean;
  country: string;
  currency: string;
  type: string;
}

interface AccountDetails {
  accountNumber: string | null;
  bankCode: string | null;
  bankName: string | null;
  accountName: string | null;
  accountVerified: boolean;
  accountVerificationDate: string | null;
  accountLocked: boolean;
  accountChangeRequested: boolean;
  accountChangeReason: string | null;
}

interface AccountVerificationResponse {
  success: boolean;
  message?: string;
  data?: {
    accountNumber: string;
    bankCode: string;
    bankName: string;
    accountName: string;
    verified: boolean;
  };
  error?: string;
}

interface BanksResponse {
  success: boolean;
  data?: Bank[];
  error?: string;
}

export function useAccountManagement() {
  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetchAccountDetails();
    fetchBanks();
  }, []);

  const fetchAccountDetails = async () => {
    try {
      const response = await fetch('/api/account/verify', {
        credentials: 'include', // Include cookies for authentication
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch account details');
      }

      setAccountDetails(result.data);
    } catch (err) {
      console.error('Error fetching account details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch account details');
    }
  };

  const fetchBanks = async () => {
    try {
      const response = await fetch('/api/banks');
      const result: BanksResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch banks');
      }

      setBanks(result.data || []);
    } catch (err) {
      console.error('Error fetching banks:', err);
      // Don't set error for banks as it's not critical
    } finally {
      setLoading(false);
    }
  };

  const verifyAccount = async (accountNumber: string, bankCode: string) => {
    try {
      setVerifying(true);
      setError(null);

      const response = await fetch('/api/account/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({ accountNumber, bankCode }),
      });

      const result: AccountVerificationResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Account verification failed');
      }

      // Refresh account details
      await fetchAccountDetails();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Account verification failed';
      setError(errorMessage);
      throw err;
    } finally {
      setVerifying(false);
    }
  };

  const requestAccountChange = async (reason: string) => {
    try {
      setError(null);

      const response = await fetch('/api/account/verify', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({ reason }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to request account change');
      }

      // Refresh account details
      await fetchAccountDetails();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request account change';
      setError(errorMessage);
      throw err;
    }
  };

  const refetch = async () => {
    setLoading(true);
    setError(null);
    await fetchAccountDetails();
    setLoading(false);
  };

  return {
    accountDetails,
    banks,
    loading,
    error,
    verifying,
    verifyAccount,
    requestAccountChange,
    refetch,
  };
}
