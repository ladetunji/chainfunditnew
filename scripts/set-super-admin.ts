import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

/**
 * Script to set a user as super admin
 * Usage: npx tsx scripts/set-super-admin.ts <email>
 * Example: npx tsx scripts/set-super-admin.ts tolu@chainfundit.org
 */

async function setSuperAdmin() {
  try {
    const email = process.argv[2];

    if (!email) {
      console.error('Usage: npx tsx scripts/set-super-admin.ts <email>');
      console.error('Example: npx tsx scripts/set-super-admin.ts tolu@chainfundit.org');
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

    console.log(`✅ Successfully set ${email} as super admin`);
    console.log(`   User ID: ${existingUser.id}`);
    console.log(`   Full Name: ${existingUser.fullName}`);
    console.log(`   Role: super_admin`);
    console.log(`   Verified: true`);
    console.log('\n🎉 Super admin setup complete!');
    console.log('The user can now access super admin features at /admin');

  } catch (error) {
    console.error('❌ Error setting super admin:', error);
    process.exit(1);
  }
}

setSuperAdmin();

