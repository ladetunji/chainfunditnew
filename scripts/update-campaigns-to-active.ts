import { db } from '../lib/db';
import { campaigns } from '../lib/schema';
import { eq, inArray } from 'drizzle-orm';

/**
 * Script to update specific campaigns to active status
 */
async function updateCampaignsToActive() {
  try {
    
    // Get some campaigns that are not already active
    const campaignsToUpdate = await db
      .select()
      .from(campaigns)
      .where(
        inArray(campaigns.status, ['paused', 'closed'])
      )
      .limit(8);
    
    if (campaignsToUpdate.length === 0) {
      return;
    }
    
    campaignsToUpdate.forEach((campaign, index) => {
    });
    
    const campaignIds = campaignsToUpdate.map(campaign => campaign.id);
    
    // Update campaigns to active status
    const updatedCampaigns = await db
      .update(campaigns)
      .set({ 
        status: 'active',
        isActive: true,
        updatedAt: new Date()
      })
      .where(inArray(campaigns.id, campaignIds))
      .returning();
    
    // Verify the update
    const activeCampaigns = await db
      .select()
      .from(campaigns)
      .where(inArray(campaigns.id, campaignIds));
    
    const allActive = activeCampaigns.every(campaign => campaign.status === 'active' && campaign.isActive === true);
    
    if (allActive) {
    } else {
    }
    
  } catch (error) {
    console.error('❌ Error updating campaigns to active status:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  updateCampaignsToActive()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

export { updateCampaignsToActive };
