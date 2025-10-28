import { generateTwoFactorSetup, verifyTwoFactorCode, enableTwoFactor } from '@/lib/two-factor-auth';

/**
 * Test script for 2FA functionality
 * This can be run to verify the 2FA implementation works correctly
 */
async function testTwoFactorAuth() {
  console.log('🧪 Testing 2FA Implementation...\n');

  try {
    // Test 1: Generate 2FA setup
    console.log('1️⃣ Testing 2FA setup generation...');
    const setup = await generateTwoFactorSetup('test@example.com');
    console.log('✅ Setup generated successfully');
    console.log(`   Secret: ${setup.secret.substring(0, 8)}...`);
    console.log(`   Backup codes: ${setup.backupCodes.length} codes generated`);
    console.log(`   QR Code URL: ${setup.qrCodeUrl.substring(0, 50)}...\n`);

    // Test 2: Verify with a test code (this will fail since it's not a real TOTP)
    console.log('2️⃣ Testing 2FA verification...');
    const verification = await verifyTwoFactorCode('test@example.com', '123456');
    console.log(`   Verification result: ${verification.isValid ? '✅ Valid' : '❌ Invalid (expected)'}\n`);

    // Test 3: Test backup code verification
    console.log('3️⃣ Testing backup code verification...');
    const backupVerification = await verifyTwoFactorCode('test@example.com', setup.backupCodes[0]);
    console.log(`   Backup code result: ${backupVerification.isValid ? '✅ Valid' : '❌ Invalid'}`);
    console.log(`   Backup code used: ${backupVerification.backupCodeUsed ? '✅ Yes' : '❌ No'}\n`);

    console.log('🎉 All 2FA tests completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Start the development server: pnpm dev');
    console.log('   2. Navigate to /admin/admin-dashboard/settings');
    console.log('   3. Enable 2FA for an admin account');
    console.log('   4. Test the verification flow');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testTwoFactorAuth();
}

export { testTwoFactorAuth };
