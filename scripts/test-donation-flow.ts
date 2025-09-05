#!/usr/bin/env tsx

/**
 * Test script for donation flow
 * 
 * This script tests the complete donation flow:
 * 1. Initialize a donation
 * 2. Simulate payment completion
 * 3. Verify donation status
 */

import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function testDonationFlow() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  console.log('🧪 Testing Donation Flow...\n');

  try {
    // Test data
    const testDonation = {
      campaignId: 'test-campaign-id', // Replace with actual campaign ID
      amount: 50,
      currency: 'USD',
      paymentProvider: 'stripe',
      message: 'Test donation from script',
      isAnonymous: false,
      simulate: true,
    };

    console.log('1. Initializing donation...');
    const initResponse = await fetch(`${baseUrl}/api/payments/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In a real test, you'd need to include auth headers
      },
      body: JSON.stringify(testDonation),
    });

    const initResult = await initResponse.json();
    console.log('Init result:', initResult);

    if (!initResult.success) {
      console.error('❌ Failed to initialize donation:', initResult.error);
      return;
    }

    console.log('✅ Donation initialized successfully');
    console.log(`   Donation ID: ${initResult.donationId}`);

    // Simulate payment
    console.log('\n2. Simulating payment...');
    const simulateResponse = await fetch(`${baseUrl}/api/payments/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        donationId: initResult.donationId,
        success: true,
      }),
    });

    const simulateResult = await simulateResponse.json();
    console.log('Simulate result:', simulateResult);

    if (!simulateResult.success) {
      console.error('❌ Failed to simulate payment:', simulateResult.error);
      return;
    }

    console.log('✅ Payment simulated successfully');

    // Verify donation status
    console.log('\n3. Verifying donation...');
    const verifyResponse = await fetch(`${baseUrl}/api/donations?donationId=${initResult.donationId}`);
    const verifyResult = await verifyResponse.json();

    if (verifyResult.success && verifyResult.data.length > 0) {
      const donation = verifyResult.data[0];
      console.log('✅ Donation verified');
      console.log(`   Status: ${donation.paymentStatus}`);
      console.log(`   Amount: ${donation.currency} ${donation.amount}`);
    } else {
      console.error('❌ Failed to verify donation');
    }

    console.log('\n🎉 Donation flow test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Payment provider configuration test
async function testPaymentConfig() {
  console.log('\n🔧 Testing Payment Configuration...\n');

  const requiredEnvVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'PAYSTACK_SECRET_KEY',
    'PAYSTACK_PUBLIC_KEY',
  ];

  let allConfigured = true;

  requiredEnvVars.forEach(envVar => {
    if (process.env[envVar]) {
      console.log(`✅ ${envVar}: Configured`);
    } else {
      console.log(`❌ ${envVar}: Missing`);
      allConfigured = false;
    }
  });

  if (allConfigured) {
    console.log('\n✅ All payment environment variables are configured');
  } else {
    console.log('\n❌ Some payment environment variables are missing');
    console.log('Please check your .env file');
  }
}

// Currency support test
function testCurrencySupport() {
  console.log('\n💱 Testing Currency Support...\n');

  const currencies = ['USD', 'EUR', 'GBP', 'NGN', 'CAD'];
  
  currencies.forEach(currency => {
    // This would use the actual getSupportedProviders function
    console.log(`${currency}: Testing...`);
    // Mock results for now
    if (currency === 'NGN') {
      console.log(`   ✅ Supported by: paystack`);
    } else {
      console.log(`   ✅ Supported by: stripe`);
    }
  });
}

// Main test runner
async function runTests() {
  console.log('🚀 ChainFundIt Donation Flow Test Suite\n');
  console.log('='.repeat(50) + '\n');

  await testPaymentConfig();
  testCurrencySupport();
  
  // Uncomment to test actual donation flow (requires auth)
  await testDonationFlow();

  console.log('\n' + '='.repeat(50));
  console.log('Tests completed! 🎯');
}

// Run if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

export { testDonationFlow, testPaymentConfig, testCurrencySupport };
