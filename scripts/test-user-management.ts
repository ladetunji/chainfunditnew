import { db } from '../lib/db';
import { users } from '../lib/schema';
import { eq } from 'drizzle-orm';

/**
 * Script to test user management functionality
 */
async function testUserManagement() {
  try {
    
    // Get a sample user to test with
    const sampleUser = await db
      .select()
      .from(users)
      .limit(1);
    
    if (sampleUser.length === 0) {
      console.log('❌ No users found in database to test with.');
      return;
    }
    
    const user = sampleUser[0];
    
    // Test status mapping
    const status = user.accountLocked ? 'suspended' : 'active';
    
    // Test user actions
    
    // Test activate action
    if (user.accountLocked) {
      const activatedUser = await db
        .update(users)
        .set({ 
          accountLocked: false,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))
        .returning();
      
    }
    
    // Test suspend action
    const suspendedUser = await db
      .update(users)
      .set({ 
        accountLocked: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();
    
    
    // Test verify action
    const verifiedUser = await db
      .update(users)
      .set({ 
        isVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();
    
    
    // Test bulk actions
    const bulkUsers = await db
      .select()
      .from(users)
      .limit(3);
    
    if (bulkUsers.length > 0) {
      const userIds = bulkUsers.map(u => u.id);
      
      const bulkActivated = await db
        .update(users)
        .set({ 
          accountLocked: false,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userIds[0])) // Just test with first user for simplicity
        .returning();
      
    }
    
  } catch (error) {
    console.error('❌ Error testing user management:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  testUserManagement()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}

export { testUserManagement };
