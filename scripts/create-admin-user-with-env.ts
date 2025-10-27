import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

// Load environment variables
config();

/**
 * Script to create admin users with environment variable loading
 * Usage: npx tsx scripts/create-admin-user-with-env.ts
 */

async function createAdminUser() {
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL environment variable is not set');
      console.error('Please set it in your .env file or run with:');
      console.error('DATABASE_URL="your-database-url" npx tsx scripts/create-admin-user-with-env.ts');
      process.exit(1);
    }

    const email = process.argv[2];
    const password = process.argv[3];
    const role = process.argv[4] || 'admin'; // 'admin' or 'super_admin'

    if (!email || !password) {
      console.error('Usage: npx tsx scripts/create-admin-user-with-env.ts <email> <password> [role]');
      console.error('Example: npx tsx scripts/create-admin-user-with-env.ts admin@chainfundit.com password123 super_admin');
      process.exit(1);
    }

    console.log('🔍 Checking if user exists...');

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      // Update existing user to admin role
      console.log('👤 User exists, updating to admin role...');
      const hashedPassword = await bcrypt.hash(password, 12);
      await db
        .update(users)
        .set({
          role: role as 'admin' | 'super_admin',
          isVerified: true,
          hasCompletedProfile: true,
        })
        .where(eq(users.id, existingUser.id));

      console.log(`✅ Updated existing user ${email} to ${role} role`);
    } else {
      // Create new admin user
      console.log('👤 Creating new admin user...');
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

      console.log(`✅ Created new ${role} user: ${email}`);
    }

    console.log('\n🎉 Admin user setup complete!');
    console.log('You can now login at /signin with these credentials');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Role: ${role}`);

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();
