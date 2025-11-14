import { generateTwoFactorSetup, verifyTwoFactorCode, enableTwoFactor } from '@/lib/two-factor-auth';

/**
 * Test script for 2FA functionality
 * This can be run to verify the 2FA implementation works correctly
 */
async function testTwoFactorAuth() {

  try {
    // Test 1: Generate 2FA setup
    const setup = await generateTwoFactorSetup('admin@chainfundit.com');
  } catch (error) {
    console.error('Error generating 2FA setup:', error);
  }
}
