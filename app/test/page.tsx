"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Target, XCircle, CheckCircle, AlertCircle } from 'lucide-react';

export default function TestPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [testCampaignId, setTestCampaignId] = useState('');

  const testCampaignLogic = async () => {
    setLoading(true);
    setMessage('');

    try {
      // Test campaign status logic
      const testCampaigns = [
        {
          id: 'test-1',
          title: 'Active Campaign (1 month duration)',
          duration: '1 month',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
          status: 'active',
          isActive: true,
          currentAmount: '250000',
          goalAmount: '1000000',
        },
        {
          id: 'test-2',
          title: 'Expired Campaign (1 week duration)',
          duration: '1 week',
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks ago
          status: 'active',
          isActive: true,
          currentAmount: '150000',
          goalAmount: '500000',
        },
        {
          id: 'test-3',
          title: 'Goal Reached Campaign',
          duration: '2 weeks',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 1 month ago
          status: 'active',
          isActive: true,
          currentAmount: '300000',
          goalAmount: '300000',
        },
        {
          id: 'test-4',
          title: 'Manually Closed Campaign',
          duration: '1 month',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 1 month ago
          status: 'closed',
          isActive: false,
          currentAmount: '400000',
          goalAmount: '800000',
        },
      ];

      const results = testCampaigns.map(campaign => {
        // Simulate the campaign status logic
        const now = new Date();
        const createdAt = new Date(campaign.createdAt);
        
        let status = 'active';
        let isActive = true;
        let reason = 'Campaign is active';
        let timeRemaining = '';

        // Check if manually closed
        if (campaign.status === 'closed' || !campaign.isActive) {
          status = 'closed';
          isActive = false;
          reason = 'Campaign manually closed';
          timeRemaining = 'Closed';
        }
        // Check if goal reached
        else if (Number(campaign.currentAmount) >= Number(campaign.goalAmount)) {
          status = 'goal_reached';
          isActive = true;
          reason = 'Funding goal reached';
          timeRemaining = 'Goal Reached';
        }
        // Check duration-based expiration
        else if (campaign.duration && campaign.duration !== 'Not applicable') {
          const durationInDays = parseDurationToDays(campaign.duration);
          if (durationInDays > 0) {
            const endDate = new Date(createdAt.getTime() + (durationInDays * 24 * 60 * 60 * 1000));
            const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
            
            if (daysRemaining <= 0) {
              status = 'expired';
              isActive = false;
              reason = `Campaign expired ${Math.abs(daysRemaining)} day(s) ago`;
              timeRemaining = `Expired ${Math.abs(daysRemaining)} days ago`;
            } else {
              status = 'active';
              isActive = true;
              reason = `${daysRemaining} day(s) remaining`;
              timeRemaining = `${daysRemaining} days left`;
            }
          }
        }

        return {
          ...campaign,
          calculatedStatus: status,
          calculatedIsActive: isActive,
          reason,
          timeRemaining,
        };
      });

      setMessage(`Campaign logic test completed. Found ${results.length} campaigns with different statuses.`);
      
      // Log results to console for inspection
      console.log('Campaign Status Test Results:', results);
      
    } catch (error) {
      setMessage(`Error testing campaign logic: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const parseDurationToDays = (duration: string): number => {
    const lowerDuration = duration.toLowerCase();
    
    if (lowerDuration.includes('week')) {
      const weeks = parseInt(duration.match(/\d+/)?.[0] || '1');
      return weeks * 7;
    }
    
    if (lowerDuration.includes('month')) {
      const months = parseInt(duration.match(/\d+/)?.[0] || '1');
      return months * 30;
    }
    
    if (lowerDuration.includes('year')) {
      const years = parseInt(duration.match(/\d+/)?.[0] || '1');
      return years * 365;
    }
    
    return 0;
  };

  const testDonationStatuses = () => {
    const testDonations = [
      { id: 1, status: 'completed', amount: '50000', donor: 'John Doe', message: 'Great cause!' },
      { id: 2, status: 'pending', amount: '25000', donor: 'Jane Smith', message: 'Processing...' },
      { id: 3, status: 'failed', amount: '30000', donor: 'Bob Johnson', message: 'Card declined' },
    ];

    console.log('Donation Status Test Data:', testDonations);
    setMessage(`Donation status test completed. Check console for ${testDonations.length} test donations.`);
  };

  const createTestCampaign = async () => {
    if (!testEmail) return;
    
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/test/create-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: testEmail }),
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage(`Test campaign created successfully! Campaign ID: ${result.data.campaign.id}. Creator: ${result.data.user.fullName}`);
        console.log('Test campaign created:', result.data);
        setTestCampaignId(result.data.campaign.id); // Auto-fill the campaign ID for testing
      } else {
        setMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      setMessage(`Error creating test campaign: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testDirectCreator = async () => {
    if (!testCampaignId) return;
    
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`/api/campaigns/${testCampaignId}/direct-creator`);
      const result = await response.json();
      
      if (result.success) {
        setMessage(`Direct Creator API Success! Creator: ${result.data.creator.fullName} (${result.data.creator.email})`);
        console.log('Direct Creator API result:', result.data);
      } else {
        setMessage(`Direct Creator API Error: ${result.error}`);
      }
    } catch (error) {
      setMessage(`Error testing Direct Creator API: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold text-[#104901] mb-8">Campaign & Donation Testing</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Campaign Status Logic
            </CardTitle>
            <CardDescription>
              Test the automatic campaign status determination based on duration and time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testCampaignLogic} 
              disabled={loading}
              className="w-full bg-[#104901] hover:bg-[#0d3a01]"
            >
              {loading ? 'Testing...' : 'Test Campaign Logic'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Donation Statuses
            </CardTitle>
            <CardDescription>
              Test different donation statuses (completed, pending, failed)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testDonationStatuses}
              className="w-full bg-[#104901] hover:bg-[#0d3a01]"
            >
              Test Donation Statuses
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Create Test Campaign
            </CardTitle>
            <CardDescription>
              Create a test campaign with a real user to test creator name display
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full p-2 border border-gray-300 rounded"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
              <Button 
                onClick={createTestCampaign}
                disabled={!testEmail || loading}
                className="w-full bg-[#104901] hover:bg-[#0d3a01]"
              >
                {loading ? 'Creating...' : 'Create Test Campaign'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Test Direct Creator API
            </CardTitle>
            <CardDescription>
              Test the direct creator endpoint to bypass JOIN issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Enter campaign ID"
                className="w-full p-2 border border-gray-300 rounded"
                value={testCampaignId}
                onChange={(e) => setTestCampaignId(e.target.value)}
              />
              <Button 
                onClick={testDirectCreator}
                disabled={!testCampaignId || loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Testing...' : 'Test Direct Creator API'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {message && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{message}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Status Types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
              <span className="text-sm text-gray-600">Campaign is running and has time remaining</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-red-100 text-red-700 border-red-200">
                <Clock className="h-3 w-3 mr-1" />
                Expired
              </Badge>
              <span className="text-sm text-gray-600">Campaign exceeded its duration</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-blue-100 text-blue-700 border-blue-200">
                <Target className="h-3 w-3 mr-1" />
                Goal Reached
              </Badge>
              <span className="text-sm text-gray-600">Campaign met its funding target</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-gray-100 text-gray-700 border-gray-200">
                <XCircle className="h-3 w-3 mr-1" />
                Closed
              </Badge>
              <span className="text-sm text-gray-600">Campaign was manually closed</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Donation Status Types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">
                ✓ Completed
              </Badge>
              <span className="text-sm text-gray-600">Payment was successful</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-yellow-100 text-yellow-700 border-yellow-200">
                ⏳ Pending
              </Badge>
              <span className="text-sm text-gray-600">Payment is being processed</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-red-100 text-red-700 border-red-200">
                ✗ Failed
              </Badge>
              <span className="text-sm text-gray-600">Payment was unsuccessful</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">How to Test:</h3>
        <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
          <li>Click "Test Campaign Logic" to see how campaigns are automatically categorized</li>
          <li>Click "Test Donation Statuses" to see different donation statuses</li>
          <li>Check the browser console for detailed test results</li>
          <li>Navigate to the campaigns page to see live/past filtering in action</li>
          <li>View a campaign page to see donation statuses displayed</li>
        </ol>
      </div>
    </div>
  );
}
