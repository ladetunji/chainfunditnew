import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

/**
 * Script to set a user as super admin
 * Usage: npx tsx scripts/set-super-admin.ts <email>
 */

async function setSuperAdmin() {
  try {
    const email = process.argv[2];

    if (!email) {
      console.error('Usage: npx tsx scripts/set-super-admin.ts <email>');
      process.exit(1);
    }

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!existingUser) {
      console.error(`❌ User with email ${email} not found.`);
      console.error('Please create the user first or check the email address.');
      process.exit(1);
    }

    // Update user to super admin role
    await db
      .update(users)
      .set({
        role: 'super_admin',
        isVerified: true,
        hasCompletedProfile: true,
      })
      .where(eq(users.id, existingUser.id));

  } catch (error) {
    console.error('❌ Error setting super admin:', error);
    process.exit(1);
  }
}

setSuperAdmin();

