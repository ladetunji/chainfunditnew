import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface TwoFactorVerification {
  isValid: boolean;
  backupCodeUsed?: boolean;
}

/**
 * Generate a new 2FA secret and QR code for setup
 */
export async function generateTwoFactorSetup(userEmail: string): Promise<TwoFactorSetup> {
  // Generate a new secret
  const secret = speakeasy.generateSecret({
    name: `ChainFundIt Admin (${userEmail})`,
    issuer: 'ChainFundIt',
    length: 32,
  });

  // Generate QR code URL
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

  // Generate backup codes
  const backupCodes = generateBackupCodes();

  return {
    secret: secret.base32,
    qrCodeUrl,
    backupCodes,
  };
}

/**
 * Verify a TOTP code against a specific secret (for setup verification)
 */
export function verifyTOTPCode(secret: string, code: string): boolean {
  console.log('Verifying TOTP:', { secret: secret.substring(0, 8) + '...', code });
  
  // Generate current token for comparison
  const currentToken = speakeasy.totp({
    secret: secret,
    encoding: 'base32',
  });
  
  console.log('Current expected token:', currentToken);
  
  const result = speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: code,
    window: 2, // Allow 2 time steps (60 seconds) tolerance
  });
  
  console.log('TOTP verification result:', result);
  
  // Also try with a larger window for debugging
  const resultWithLargeWindow = speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: code,
    window: 10, // Allow 10 time steps (5 minutes) tolerance
  });
  
  console.log('TOTP verification with large window:', resultWithLargeWindow);
  
  return result;
}

/**
 * Verify a TOTP code or backup code
 */
export async function verifyTwoFactorCode(
  userEmail: string,
  code: string
): Promise<TwoFactorVerification> {
  // Get user's 2FA secret
  const [user] = await db
    .select({
      twoFactorSecret: users.twoFactorSecret,
      twoFactorBackupCodes: users.twoFactorBackupCodes,
    })
    .from(users)
    .where(eq(users.email, userEmail))
    .limit(1);

  if (!user || !user.twoFactorSecret) {
    return { isValid: false };
  }

  // Check if it's a backup code
  const backupCodes = user.twoFactorBackupCodes ? JSON.parse(user.twoFactorBackupCodes) : [];
  const backupCodeIndex = backupCodes.indexOf(code);

  if (backupCodeIndex !== -1) {
    // Remove used backup code
    backupCodes.splice(backupCodeIndex, 1);
    await db
      .update(users)
      .set({ twoFactorBackupCodes: JSON.stringify(backupCodes) })
      .where(eq(users.email, userEmail));

    return { isValid: true, backupCodeUsed: true };
  }

  // Verify TOTP code
  const isValid = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: code,
    window: 2, // Allow 2 time steps (60 seconds) tolerance
  });

  return { isValid };
}

/**
 * Enable 2FA for a user
 */
export async function enableTwoFactor(
  userEmail: string,
  secret: string,
  backupCodes: string[]
): Promise<boolean> {
  try {
    await db
      .update(users)
      .set({
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        twoFactorBackupCodes: JSON.stringify(backupCodes),
      })
      .where(eq(users.email, userEmail));

    return true;
  } catch (error) {
    console.error('Error enabling 2FA:', error);
    return false;
  }
}

/**
 * Disable 2FA for a user
 */
export async function disableTwoFactor(userEmail: string): Promise<boolean> {
  try {
    await db
      .update(users)
      .set({
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
      })
      .where(eq(users.email, userEmail));

    return true;
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    return false;
  }
}

/**
 * Check if user has 2FA enabled
 */
export async function isTwoFactorEnabled(userEmail: string): Promise<boolean> {
  const [user] = await db
    .select({ twoFactorEnabled: users.twoFactorEnabled })
    .from(users)
    .where(eq(users.email, userEmail))
    .limit(1);

  return user?.twoFactorEnabled || false;
}

/**
 * Generate backup codes
 */
function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    codes.push(generateRandomCode());
  }
  return codes;
}

/**
 * Generate a random backup code
 */
function generateRandomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Regenerate backup codes for a user
 */
export async function regenerateBackupCodes(userEmail: string): Promise<string[]> {
  const newBackupCodes = generateBackupCodes();
  
  await db
    .update(users)
    .set({ twoFactorBackupCodes: JSON.stringify(newBackupCodes) })
    .where(eq(users.email, userEmail));

  return newBackupCodes;
}
