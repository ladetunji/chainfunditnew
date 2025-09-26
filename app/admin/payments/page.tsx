"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface PendingPayment {
  id: string;
  campaignId: string;
  amount: string;
  currency: string;
  paymentMethod: string;
  paymentIntentId: string | null;
  createdAt: string;
  lastStatusUpdate: string;
}

export default function AdminPaymentsPage() {
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/process-pending-payments');
      const data = await response.json();
      
      if (data.success) {
        setPendingPayments(data.data);
      } else {
        toast.error('Failed to fetch pending payments');
      }
    } catch (error) {
      console.error('Error fetching pending payments:', error);
      toast.error('Error fetching pending payments');
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async (donationId: string, action: 'verify' | 'complete' | 'fail') => {
    try {
      setProcessing(donationId);
      const response = await fetch('/api/admin/process-pending-payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          donationId,
          action,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        // Refresh the list
        await fetchPendingPayments();
      } else {
        toast.error(data.error || 'Failed to process payment');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Error processing payment');
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount: string, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(parseFloat(amount));
  };

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Pending Payments</h1>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Pending Payments</h1>
        <Button onClick={fetchPendingPayments} variant="outline">
          Refresh
        </Button>
      </div>

      {pendingPayments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">No pending payments found</p>
          <p className="text-gray-400 text-sm mt-2">
            All payments are either completed or failed
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Donation ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Intent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {payment.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(payment.amount, payment.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {payment.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                      {payment.paymentIntentId ? (
                        <span className="truncate max-w-xs block">
                          {payment.paymentIntentId}
                        </span>
                      ) : (
                        <span className="text-gray-400">No ID</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(payment.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {payment.paymentMethod === 'paystack' && payment.paymentIntentId && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => processPayment(payment.id, 'verify')}
                          disabled={processing === payment.id}
                        >
                          {processing === payment.id ? 'Verifying...' : 'Verify'}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => processPayment(payment.id, 'complete')}
                        disabled={processing === payment.id}
                      >
                        {processing === payment.id ? 'Processing...' : 'Complete'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => processPayment(payment.id, 'fail')}
                        disabled={processing === payment.id}
                      >
                        {processing === payment.id ? 'Processing...' : 'Fail'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">How to use this tool:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li><strong>Verify:</strong> Check with the payment provider (Paystack) to confirm the actual status</li>
          <li><strong>Complete:</strong> Manually mark the payment as completed (use when you know it succeeded)</li>
          <li><strong>Fail:</strong> Manually mark the payment as failed (use when you know it failed)</li>
        </ul>
        <p className="text-xs text-blue-600 mt-2">
          Note: This tool is for development/testing purposes. In production, webhooks should handle status updates automatically.
        </p>
      </div>
    </div>
  );
}
