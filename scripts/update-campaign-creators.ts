import { db } from '../lib/db';
import { campaigns, users } from '../lib/schema';
import { eq } from 'drizzle-orm';

async function updateCampaignCreators() {
  try {
    console.log('Starting campaign creator update...');
    
    // Get all campaigns with their creator IDs
    const allCampaigns = await db
      .select({
        id: campaigns.id,
        creatorId: campaigns.creatorId,
        title: campaigns.title,
      })
      .from(campaigns);
    
    console.log(`Found ${allCampaigns.length} campaigns to check`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const campaign of allCampaigns) {
      try {
        if (!campaign.creatorId) {
          console.log(`Campaign ${campaign.id} (${campaign.title}) has no creatorId, skipping`);
          continue;
        }
        
        // Get the user's fullName for this creatorId
        const [user] = await db
          .select({
            id: users.id,
            fullName: users.fullName,
            email: users.email,
          })
          .from(users)
          .where(eq(users.id, campaign.creatorId))
          .limit(1);
        
        if (!user) {
          console.log(`Campaign ${campaign.id} (${campaign.title}) has invalid creatorId: ${campaign.creatorId}`);
          errorCount++;
          continue;
        }
        
        console.log(`Campaign ${campaign.id} (${campaign.title}) - Creator: ${user.fullName} (${user.email})`);
        updatedCount++;
        
      } catch (error) {
        console.error(`Error processing campaign ${campaign.id}:`, error);
        errorCount++;
      }
    }
    
    console.log(`\nUpdate complete!`);
    console.log(`- Total campaigns: ${allCampaigns.length}`);
    console.log(`- Successfully processed: ${updatedCount}`);
    console.log(`- Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('Error updating campaign creators:', error);
  }
}

// Run the update
updateCampaignCreators().catch(console.error);
