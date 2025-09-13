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

    const initResponse = await fetch(`${baseUrl}/api/payments/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In a real test, you'd need to include auth headers
      },
      body: JSON.stringify(testDonation),
    });

    const initResult = await initResponse.json();

    if (!initResult.success) {
      console.error('❌ Failed to initialize donation:', initResult.error);
      return;
    }
    // Simulate payment
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

    if (!simulateResult.success) {
      console.error('❌ Failed to simulate payment:', simulateResult.error);
      return;
    }

    // Verify donation status
    const verifyResponse = await fetch(`${baseUrl}/api/donations?donationId=${initResult.donationId}`);
    const verifyResult = await verifyResponse.json();

    if (verifyResult.success && verifyResult.data.length > 0) {
      const donation = verifyResult.data[0];
    
    } else {
      console.error('❌ Failed to verify donation');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Payment provider configuration test
async function testPaymentConfig() {

  const requiredEnvVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'PAYSTACK_SECRET_KEY',
    'PAYSTACK_PUBLIC_KEY',
  ];

  let allConfigured = true;

  requiredEnvVars.forEach(envVar => {
    if (process.env[envVar]) {
    
    } else {
      allConfigured = false;
    }
  });

}

// Currency support test
function testCurrencySupport() {
 

  const currencies = ['USD', 'EUR', 'GBP', 'NGN', 'CAD'];
  
  currencies.forEach(currency => {
    if (currency === 'NGN') {
    } else {
      console.log(`Supported by: stripe`);
    }
  });
}

// Main test runner
async function runTests() {
  await testPaymentConfig();
  testCurrencySupport();
  
  // Uncomment to test actual donation flow (requires auth)
  await testDonationFlow();
}

// Run if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

export { testDonationFlow, testPaymentConfig, testCurrencySupport };
