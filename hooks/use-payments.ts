import { useState, useEffect } from 'react';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  paymentStatus: 'completed' | 'pending' | 'failed';
  paymentProvider: 'stripe' | 'paystack';
  transactionId?: string;
  message?: string;
  isAnonymous: boolean;
  donorName?: string;
  donorEmail?: string;
  donorAvatar?: string;
  createdAt: string;
  processedAt?: string;
  campaignId: string;
  campaignTitle: string;
  campaignCurrency: string;
}

interface PaymentSummary {
  total: number;
  completed: number;
  pending: number;
  failed: number;
  totalAmount: number;
  completedAmount: number;
  pendingAmount: number;
  failedAmount: number;
}

interface PaymentData {
  payments: Payment[];
  summary: PaymentSummary;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function usePayments(status?: 'completed' | 'pending' | 'failed', page: number = 1, limit: number = 20) {
  const [data, setData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (status) {
        params.append('status', status);
      }

      const response = await fetch(`/api/payments?${params}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to load payments');
      }
    } catch (err) {
      setError('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const refreshPayments = () => {
    fetchPayments();
  };

  useEffect(() => {
    fetchPayments();
  }, [status, page, limit]);

  return {
    payments: data?.payments || [],
    summary: data?.summary || {
      total: 0,
      completed: 0,
      pending: 0,
      failed: 0,
      totalAmount: 0,
      completedAmount: 0,
      pendingAmount: 0,
      failedAmount: 0,
    },
    pagination: data?.pagination || {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
    loading,
    error,
    refreshPayments,
  };
}

export function usePaymentRetry() {
  const [retrying, setRetrying] = useState<Set<string>>(new Set());

  const retryPayment = async (paymentId: string) => {
    setRetrying(prev => new Set(prev).add(paymentId));
    
    try {
      const response = await fetch(`/api/donations/${paymentId}/retry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        return { success: true, message: 'Payment retry initiated successfully' };
      } else {
        return { success: false, message: result.error || 'Failed to retry payment' };
      }
    } catch (error) {
      return { success: false, message: 'An error occurred while retrying the payment' };
    } finally {
      setRetrying(prev => {
        const newSet = new Set(prev);
        newSet.delete(paymentId);
        return newSet;
      });
    }
  };

  return {
    retryPayment,
    isRetrying: (paymentId: string) => retrying.has(paymentId),
  };
}
