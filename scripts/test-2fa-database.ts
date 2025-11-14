import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

/**
 * Test script to check 2FA database fields
 */
async function testTwoFactorDatabase() {

  try {
    // Test with a sample email (replace with actual admin email)
    const testEmail = 'admin@chainfundit.com';
    
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        twoFactorEnabled: users.twoFactorEnabled,
        twoFactorSecret: users.twoFactorSecret,
        twoFactorBackupCodes: users.twoFactorBackupCodes,
      })
      .from(users)
      .where(eq(users.email, testEmail))
      .limit(1);

    if (user) {
    } else {
    }

  } catch (error) {
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testTwoFactorDatabase();
}

export { testTwoFactorDatabase };
