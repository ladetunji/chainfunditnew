import { db } from '../lib/db';
import { campaigns } from '../lib/schema';
import { eq } from 'drizzle-orm';

/**
 * Script to update any campaigns with "rejected" status to "closed" status
 * This is needed after removing the campaign approval/rejection flow
 */
async function updateRejectedCampaigns() {
  try {
    
    // Find campaigns with rejected status
    const rejectedCampaigns = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.status, 'rejected'));
    
    if (rejectedCampaigns.length === 0) {
      return;
    }
    
    rejectedCampaigns.forEach(campaign => {
    });
    
    // Update rejected campaigns to closed status
    const updatedCampaigns = await db
      .update(campaigns)
      .set({ 
        status: 'closed',
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(campaigns.status, 'rejected'))
      .returning();
    
    
    // Verify the update
    const remainingRejected = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.status, 'rejected'));
    
    if (remainingRejected.length === 0) {
    } else {
    }
    
  } catch (error) {
    console.error('❌ Error updating rejected campaigns:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  updateRejectedCampaigns()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

export { updateRejectedCampaigns };
