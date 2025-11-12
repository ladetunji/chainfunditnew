import speakeasy from 'speakeasy';

/**
 * Test TOTP generation and verification
 */
function testTOTP() {

  // Generate a secret
  const secret = speakeasy.generateSecret({
    name: 'Test User',
    issuer: 'ChainFundIt',
    length: 32,
  });

  // Generate current TOTP token
  const token = speakeasy.totp({
    secret: secret.base32,
    encoding: 'base32',
  });

  // Verify the token
  const isValid = speakeasy.totp.verify({
    secret: secret.base32,
    encoding: 'base32',
    token: token,
    window: 2,
  });

  // Test with a wrong token
  const isInvalid = speakeasy.totp.verify({
    secret: secret.base32,
    encoding: 'base32',
    token: '123456',
    window: 2,
  });

}

testTOTP();
