import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

/**
 * Test script to check 2FA database fields
 */
async function testTwoFactorDatabase() {
  console.log('🧪 Testing 2FA Database Fields...\n');

  try {
    // Test with a sample email (replace with actual admin email)
    const testEmail = 'aminattobiahmed@gmail.com';
    
    console.log('1️⃣ Checking user 2FA fields...');
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
      console.log('✅ User found:', {
        email: user.email,
        twoFactorEnabled: user.twoFactorEnabled,
        hasSecret: !!user.twoFactorSecret,
        hasBackupCodes: !!user.twoFactorBackupCodes,
      });
    } else {
      console.log('❌ User not found with email:', testEmail);
    }

    console.log('\n🎉 Database test completed!');
    console.log('\n📋 Next steps:');
    console.log('   1. Try the 2FA setup again');
    console.log('   2. Check the browser console for debug logs');
    console.log('   3. Check the server console for database logs');

  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testTwoFactorDatabase();
}

export { testTwoFactorDatabase };
