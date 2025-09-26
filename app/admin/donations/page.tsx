"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface PendingDonation {
  id: string;
  campaignId: string;
  amount: string;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  processedAt: string | null;
}

export default function AdminDonationsPage() {
  const [pendingDonations, setPendingDonations] = useState<PendingDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchPendingDonations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/update-donations');
      const data = await response.json();
      
      if (data.success) {
        setPendingDonations(data.data);
      } else {
        toast.error('Failed to fetch pending donations');
      }
    } catch (error) {
      toast.error('Error fetching pending donations');
    } finally {
      setLoading(false);
    }
  };

  const updateDonationStatus = async (donationId: string, status: 'completed' | 'failed') => {
    try {
      setUpdating(donationId);
      const response = await fetch('/api/admin/update-donations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          donationId,
          status,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Donation ${status} successfully`);
        await fetchPendingDonations(); // Refresh the list
      } else {
        toast.error(data.error || 'Failed to update donation');
      }
    } catch (error) {
      toast.error('Error updating donation');
    } finally {
      setUpdating(null);
    }
  };

  const updateAllDonations = async (status: 'completed' | 'failed') => {
    try {
      setUpdating('all');
      const response = await fetch('/api/admin/update-donations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Updated ${data.updatedCount} donations to ${status}`);
        await fetchPendingDonations(); // Refresh the list
      } else {
        toast.error(data.error || 'Failed to update donations');
      }
    } catch (error) {
      toast.error('Error updating donations');
    } finally {
      setUpdating(null);
    }
  };

  useEffect(() => {
    fetchPendingDonations();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#104901] mx-auto mb-4"></div>
              <p className="text-lg text-gray-600">Loading pending donations...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Pending Donations</h1>
            <div className="flex gap-3">
              <Button
                onClick={() => updateAllDonations('completed')}
                disabled={pendingDonations.length === 0 || updating === 'all'}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {updating === 'all' ? 'Updating...' : `Complete All (${pendingDonations.length})`}
              </Button>
              <Button
                onClick={() => updateAllDonations('failed')}
                disabled={pendingDonations.length === 0 || updating === 'all'}
                variant="destructive"
              >
                {updating === 'all' ? 'Updating...' : 'Fail All'}
              </Button>
              <Button
                onClick={fetchPendingDonations}
                variant="outline"
              >
                Refresh
              </Button>
            </div>
          </div>

          {pendingDonations.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pending Donations</h3>
              <p className="text-gray-600">All donations have been processed!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Donation ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Campaign ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
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
                  {pendingDonations.map((donation) => (
                    <tr key={donation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {donation.id.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {donation.campaignId.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {donation.currency} {donation.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {donation.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(donation.createdAt).toLocaleDateString()} {new Date(donation.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <Button
                            onClick={() => updateDonationStatus(donation.id, 'completed')}
                            disabled={updating === donation.id}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {updating === donation.id ? 'Updating...' : 'Complete'}
                          </Button>
                          <Button
                            onClick={() => updateDonationStatus(donation.id, 'failed')}
                            disabled={updating === donation.id}
                            size="sm"
                            variant="destructive"
                          >
                            {updating === donation.id ? 'Updating...' : 'Fail'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
