import { Donation } from '@/lib/schema/donations';

export interface TestDonation extends Omit<Donation, 'id' | 'createdAt' | 'processedAt'> {
  id: string;
  createdAt: string;
  processedAt?: string;
}

/**
 * Generate test donation data with different statuses for testing
 */
export function generateTestDonations(campaignId: string, donorIds: string[]): TestDonation[] {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  return [
    // Successful donations
    {
      id: 'test-donation-1',
      campaignId,
      donorId: donorIds[0] || 'test-donor-1',
      chainerId: null,
      amount: '50000',
      currency: 'NGN',
      paymentStatus: 'completed',
      paymentMethod: 'paystack',
      paymentIntentId: 'pi_test_1',
      message: 'Great cause! Hope this helps.',
      isAnonymous: false,
      createdAt: oneDayAgo.toISOString(),
      processedAt: oneDayAgo.toISOString(),
      retryAttempts: 0,
      failureReason: null,
      lastStatusUpdate: oneDayAgo,
      providerStatus: 'success',
      providerError: null,
    },
    {
      id: 'test-donation-2',
      campaignId,
      donorId: donorIds[1] || 'test-donor-2',
      chainerId: 'test-chainer-1',
      amount: '25000',
      currency: 'NGN',
      paymentStatus: 'completed',
      paymentMethod: 'stripe',
      paymentIntentId: 'pi_test_2',
      message: 'Supporting through referral link',
      isAnonymous: false,
      createdAt: twoDaysAgo.toISOString(),
      processedAt: twoDaysAgo.toISOString(),
      retryAttempts: 0,
      failureReason: null,
      lastStatusUpdate: twoDaysAgo,
      providerStatus: 'success',
      providerError: null,
    },
    {
      id: 'test-donation-3',
      campaignId,
      donorId: donorIds[2] || 'test-donor-3',
      chainerId: null,
      amount: '100000',
      currency: 'NGN',
      paymentStatus: 'completed',
      paymentMethod: 'paystack',
      paymentIntentId: 'pi_test_3',
      message: '',
      isAnonymous: true,
      createdAt: oneWeekAgo.toISOString(),
      processedAt: oneWeekAgo.toISOString(),
      retryAttempts: 0,
      failureReason: null,
      lastStatusUpdate: oneWeekAgo,
      providerStatus: 'success',
      providerError: null,
    },
    
    // Pending donations
    {
      id: 'test-donation-4',
      campaignId,
      donorId: donorIds[3] || 'test-donor-4',
      chainerId: null,
      amount: '75000',
      currency: 'NGN',
      paymentStatus: 'pending',
      paymentMethod: 'paystack',
      paymentIntentId: 'pi_test_4',
      message: 'Processing payment...',
      isAnonymous: false,
      createdAt: new Date().toISOString(),
      processedAt: undefined,
      retryAttempts: 0,
      failureReason: null,
      lastStatusUpdate: new Date(),
      providerStatus: 'pending',
      providerError: null,
    },
    {
      id: 'test-donation-5',
      campaignId,
      donorId: donorIds[4] || 'test-donor-5',
      chainerId: 'test-chainer-2',
      amount: '15000',
      currency: 'NGN',
      paymentStatus: 'pending',
      paymentMethod: 'stripe',
      paymentIntentId: 'pi_test_5',
      message: 'Waiting for confirmation',
      isAnonymous: false,
      createdAt: new Date().toISOString(),
      processedAt: undefined,
      retryAttempts: 0,
      failureReason: null,
      lastStatusUpdate: new Date(),
      providerStatus: 'pending',
      providerError: null,
    },
    
    // Failed donations
    {
      id: 'test-donation-6',
      campaignId,
      donorId: donorIds[5] || 'test-donor-6',
      chainerId: null,
      amount: '30000',
      currency: 'NGN',
      paymentStatus: 'failed',
      paymentMethod: 'paystack',
      paymentIntentId: 'pi_test_6',
      message: 'Card declined',
      isAnonymous: false,
      createdAt: oneDayAgo.toISOString(),
      processedAt: oneDayAgo.toISOString(),
      retryAttempts: 1,
      failureReason: 'Card declined by bank',
      lastStatusUpdate: oneDayAgo,
      providerStatus: 'failed',
      providerError: 'Card declined',
    },
    {
      id: 'test-donation-7',
      campaignId,
      donorId: donorIds[6] || 'test-donor-7',
      chainerId: null,
      amount: '45000',
      currency: 'NGN',
      paymentStatus: 'failed',
      paymentMethod: 'stripe',
      paymentIntentId: 'pi_test_7',
      message: 'Insufficient funds',
      isAnonymous: true,
      createdAt: twoDaysAgo.toISOString(),
      processedAt: twoDaysAgo.toISOString(),
      retryAttempts: 2,
      failureReason: 'Insufficient funds',
      lastStatusUpdate: twoDaysAgo,
      providerStatus: 'failed',
      providerError: 'Insufficient funds',
    },
  ];
}

/**
 * Generate test campaign data with different durations for testing time-based logic
 */
export function generateTestCampaigns(creatorId: string) {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  return [
    // Active campaign with time remaining
    {
      id: 'test-campaign-1',
      creatorId,
      title: 'Test Active Campaign',
      subtitle: 'A campaign with time remaining',
      description: 'This campaign is still active and has time remaining.',
      reason: 'Business',
      fundraisingFor: 'Yourself',
      duration: '1 month',
      goalAmount: '1000000',
      currentAmount: '250000',
      currency: 'NGN',
      status: 'active',
      isActive: true,
      createdAt: oneWeekAgo.toISOString(),
      updatedAt: oneWeekAgo.toISOString(),
      closedAt: null,
    },
    
    // Expired campaign
    {
      id: 'test-campaign-2',
      creatorId,
      title: 'Test Expired Campaign',
      subtitle: 'A campaign that has expired',
      description: 'This campaign has exceeded its duration and should be marked as past.',
      reason: 'Charity',
      fundraisingFor: 'Charity',
      duration: '1 week',
      goalAmount: '500000',
      currentAmount: '150000',
      currency: 'NGN',
      status: 'active',
      isActive: true,
      createdAt: twoWeeksAgo.toISOString(),
      updatedAt: twoWeeksAgo.toISOString(),
      closedAt: null,
    },
    
    // Goal reached campaign
    {
      id: 'test-campaign-3',
      creatorId,
      title: 'Test Goal Reached Campaign',
      subtitle: 'A campaign that reached its goal',
      description: 'This campaign has reached its funding goal and should be marked as past.',
      reason: 'Education',
      fundraisingFor: 'Someone else',
      duration: '2 weeks',
      goalAmount: '300000',
      currentAmount: '300000',
      currency: 'NGN',
      status: 'active',
      isActive: true,
      createdAt: oneMonthAgo.toISOString(),
      updatedAt: oneMonthAgo.toISOString(),
      closedAt: null,
    },
    
    // Manually closed campaign
    {
      id: 'test-campaign-4',
      creatorId,
      title: 'Test Closed Campaign',
      subtitle: 'A manually closed campaign',
      description: 'This campaign was manually closed by the creator.',
      reason: 'Medical',
      fundraisingFor: 'Yourself',
      duration: '1 month',
      goalAmount: '800000',
      currentAmount: '400000',
      currency: 'NGN',
      status: 'closed',
      isActive: false,
      createdAt: oneMonthAgo.toISOString(),
      updatedAt: now.toISOString(),
      closedAt: now.toISOString(),
    },
  ];
}
