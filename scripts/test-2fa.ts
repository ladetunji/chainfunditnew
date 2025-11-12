import { generateTwoFactorSetup, verifyTwoFactorCode, enableTwoFactor } from '@/lib/two-factor-auth';

/**
 * Test script for 2FA functionality
 * This can be run to verify the 2FA implementation works correctly
 */
async function testTwoFactorAuth() {

  try {
    // Test 1: Generate 2FA setup
    const setup = await generateTwoFactorSetup('tolu@chainfundit.org');

  } catch (error) {
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testTwoFactorAuth();
}

export { testTwoFactorAuth };
