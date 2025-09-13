import { db } from '../lib/db';
import { campaigns } from '../lib/schema/campaigns';
import { desc } from 'drizzle-orm';

async function checkCampaignImages() {
  try {
    // Get all campaigns
    const allCampaigns = await db
      .select()
      .from(campaigns)
      .orderBy(desc(campaigns.createdAt));

    if (allCampaigns.length === 0) {
      return;
    }

    // Check image status
    let withCoverImage = 0;
    let withGalleryImages = 0;
    let withDocuments = 0;
    let missingAll = 0;

    allCampaigns.forEach((campaign, index) => {
      const hasCoverImage = campaign.coverImageUrl && campaign.coverImageUrl !== '';
      const hasGalleryImages = campaign.galleryImages && campaign.galleryImages !== '';
      const hasDocuments = campaign.documents && campaign.documents !== '';
      
      if (hasCoverImage) withCoverImage++;
      if (hasGalleryImages) withGalleryImages++;
      if (hasDocuments) withDocuments++;
      if (!hasCoverImage && !hasGalleryImages && !hasDocuments) missingAll++;

    });

  } catch (error) {
    console.error('Error checking campaign images:', error);
  } finally {
    process.exit(0);
  }
}

checkCampaignImages();
