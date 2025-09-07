import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

interface TestDonationData {
  campaignId: string;
  amount: number;
  currency: string;
  paymentProvider: 'stripe' | 'paystack';
  message?: string;
  isAnonymous?: boolean;
}

interface DonationResult {
  success: boolean;
  donationId?: string;
  error?: string;
}

// Test campaign ID - you'll need to replace this with a real campaign ID
const TEST_CAMPAIGN_ID = 'your-campaign-id-here';

async function initializeTestDonation(donationData: TestDonationData): Promise<DonationResult> {
  try {
    const response = await fetch('http://localhost:3001/api/payments/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // You'll need to add authentication headers here
        // 'Cookie': 'your-session-cookie'
      },
      body: JSON.stringify({
        ...donationData,
        simulate: true, // This creates a pending donation
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error initializing donation:', error);
    return { success: false, error: 'Failed to initialize donation' };
  }
}

async function simulatePaymentStatus(
  donationId: string, 
  status: 'completed' | 'failed' | 'pending'
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('http://localhost:3001/api/payments/simulate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // You'll need to add authentication headers here
        // 'Cookie': 'your-session-cookie'
      },
      body: JSON.stringify({
        donationId,
        status,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error simulating payment:', error);
    return { success: false, error: 'Failed to simulate payment' };
  }
}

async function testPendingDonation() {
  console.log('\n🔄 Testing Pending Donation Flow...');
  
  const donationData: TestDonationData = {
    campaignId: TEST_CAMPAIGN_ID,
    amount: 50,
    currency: 'NGN',
    paymentProvider: 'stripe',
    message: 'Test pending donation',
    isAnonymous: false,
  };

  // Step 1: Initialize donation (creates pending status)
  console.log('1. Initializing donation...');
  const initResult = await initializeTestDonation(donationData);
  
  if (!initResult.success) {
    console.error('❌ Failed to initialize donation:', initResult.error);
    return;
  }

  console.log('✅ Donation initialized with ID:', initResult.donationId);
  console.log('📊 Status: PENDING (as expected)');

  // Step 2: Keep it pending (don't simulate completion)
  console.log('2. Leaving donation in pending state...');
  console.log('✅ Donation remains PENDING - check your dashboard donations page');

  return initResult.donationId;
}

async function testFailedDonation() {
  console.log('\n❌ Testing Failed Donation Flow...');
  
  const donationData: TestDonationData = {
    campaignId: TEST_CAMPAIGN_ID,
    amount: 75,
    currency: 'NGN',
    paymentProvider: 'paystack',
    message: 'Test failed donation',
    isAnonymous: true,
  };

  // Step 1: Initialize donation (creates pending status)
  console.log('1. Initializing donation...');
  const initResult = await initializeTestDonation(donationData);
  
  if (!initResult.success) {
    console.error('❌ Failed to initialize donation:', initResult.error);
    return;
  }

  console.log('✅ Donation initialized with ID:', initResult.donationId);

  // Step 2: Simulate failed payment
  console.log('2. Simulating failed payment...');
  const simulateResult = await simulatePaymentStatus(initResult.donationId!, 'failed');
  
  if (!simulateResult.success) {
    console.error('❌ Failed to simulate payment:', simulateResult.error);
    return;
  }

  console.log('✅ Payment simulation failed');
  console.log('📊 Status: FAILED - check your dashboard donations page');

  return initResult.donationId;
}

async function testCompletedDonation() {
  console.log('\n✅ Testing Completed Donation Flow...');
  
  const donationData: TestDonationData = {
    campaignId: TEST_CAMPAIGN_ID,
    amount: 100,
    currency: 'NGN',
    paymentProvider: 'stripe',
    message: 'Test completed donation',
    isAnonymous: false,
  };

  // Step 1: Initialize donation (creates pending status)
  console.log('1. Initializing donation...');
  const initResult = await initializeTestDonation(donationData);
  
  if (!initResult.success) {
    console.error('❌ Failed to initialize donation:', initResult.error);
    return;
  }

  console.log('✅ Donation initialized with ID:', initResult.donationId);

  // Step 2: Simulate successful payment
  console.log('2. Simulating successful payment...');
  const simulateResult = await simulatePaymentStatus(initResult.donationId!, 'completed');
  
  if (!simulateResult.success) {
    console.error('❌ Failed to simulate payment:', simulateResult.error);
    return;
  }

  console.log('✅ Payment simulation successful');
  console.log('📊 Status: COMPLETED - check your dashboard donations page and campaign data');

  return initResult.donationId;
}

async function main() {
  console.log('🧪 Testing Pending and Failed Donation Flows');
  console.log('==============================================');
  
  // Check if we have a valid campaign ID
  if (TEST_CAMPAIGN_ID === 'your-campaign-id-here') {
    console.log('❌ Please update TEST_CAMPAIGN_ID with a real campaign ID');
    console.log('💡 You can find campaign IDs by:');
    console.log('   1. Going to your dashboard');
    console.log('   2. Looking at the URL: /campaign/[id]');
    console.log('   3. Or checking the database directly');
    return;
  }

  try {
    // Test all three scenarios
    await testPendingDonation();
    await testFailedDonation();
    await testCompletedDonation();

    console.log('\n🎉 All tests completed!');
    console.log('\n📋 What to check:');
    console.log('1. Dashboard > Donations > Received (should show completed donations)');
    console.log('2. Dashboard > Donations > Pending (should show pending donations)');
    console.log('3. Dashboard > Donations > Failed (should show failed donations)');
    console.log('4. Campaign page should reflect updated amounts from completed donations');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the tests
main();
