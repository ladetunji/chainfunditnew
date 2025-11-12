import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

/**
 * Script to create admin users
 * Usage: npx tsx scripts/create-admin-user.ts
 */

async function createAdminUser() {
  try {
    const email = process.argv[2];
    const password = process.argv[3];
    const role = process.argv[4] || 'admin'; // 'admin' or 'super_admin'

    if (!email || !password) {
      console.error('Usage: npx tsx scripts/create-admin-user.ts <email> <password> [role]');
      console.error('Example: npx tsx scripts/create-admin-user.ts admin@chainfundit.com password123 super_admin');
      process.exit(1);
    }

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      // Update existing user to admin role
      const hashedPassword = await bcrypt.hash(password, 12);
      await db
        .update(users)
        .set({
          role: role as 'admin' | 'super_admin',
          isVerified: true,
          hasCompletedProfile: true,
        })
        .where(eq(users.id, existingUser.id));

    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash(password, 12);
      const [newUser] = await db
        .insert(users)
        .values({
          email,
          fullName: email.split('@')[0],
          role: role as 'admin' | 'super_admin',
          isVerified: true,
          hasCompletedProfile: true,
        })
        .returning();

    }

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();
