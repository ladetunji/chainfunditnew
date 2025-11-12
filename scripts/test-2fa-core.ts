import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

/**
 * Simple test for 2FA core functionality without database
 */
async function testTwoFactorCore() {

  try {
    // Test 1: Generate secret
    const secret = speakeasy.generateSecret({
      name: 'Test User',
      issuer: 'ChainFundIt',
      length: 32,
    });

    // Test 2: Generate QR Code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    // Test 3: Generate TOTP token
    const token = speakeasy.totp({
      secret: secret.base32,
      encoding: 'base32',
    });

    // Test 4: Verify TOTP token
    const isValid = speakeasy.totp.verify({
      secret: secret.base32,
      encoding: 'base32',
      token: token,
      window: 2,
    });

    // Test 5: Test invalid token
    const isInvalid = speakeasy.totp.verify({
      secret: secret.base32,
      encoding: 'base32',
      token: '123456',
      window: 2,
    });

  } catch (error) {
  }
}

// Run the test
testTwoFactorCore();
