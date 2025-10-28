import speakeasy from 'speakeasy';

/**
 * Test TOTP generation and verification
 */
function testTOTP() {
  console.log('🧪 Testing TOTP Generation and Verification...\n');

  // Generate a secret
  const secret = speakeasy.generateSecret({
    name: 'Test User',
    issuer: 'ChainFundIt',
    length: 32,
  });

  console.log('1️⃣ Generated Secret:');
  console.log(`   Base32: ${secret.base32}`);
  console.log(`   OTP Auth URL: ${secret.otpauth_url}\n`);

  // Generate current TOTP token
  const token = speakeasy.totp({
    secret: secret.base32,
    encoding: 'base32',
  });

  console.log('2️⃣ Generated TOTP Token:');
  console.log(`   Current token: ${token}\n`);

  // Verify the token
  const isValid = speakeasy.totp.verify({
    secret: secret.base32,
    encoding: 'base32',
    token: token,
    window: 2,
  });

  console.log('3️⃣ Verification Result:');
  console.log(`   Token verification: ${isValid ? '✅ Valid' : '❌ Invalid'}\n`);

  // Test with a wrong token
  const isInvalid = speakeasy.totp.verify({
    secret: secret.base32,
    encoding: 'base32',
    token: '123456',
    window: 2,
  });

  console.log('4️⃣ Wrong Token Test:');
  console.log(`   Wrong token verification: ${!isInvalid ? '✅ Correctly rejected' : '❌ Should have been rejected'}\n`);

  console.log('🎉 TOTP test completed!');
  console.log('\n📋 Manual Test Instructions:');
  console.log('   1. Copy the secret above');
  console.log('   2. Add it to Google Authenticator or similar app');
  console.log('   3. Enter the generated code in the 2FA setup form');
  console.log('   4. Check the browser console for debug logs');
}

testTOTP();
