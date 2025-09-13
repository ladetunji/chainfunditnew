import { db } from '../lib/db';
import { campaigns } from '../lib/schema/campaigns';
import { desc } from 'drizzle-orm';

async function checkCampaignImages() {
  try {
    console.log('🔍 Checking campaign images...\n');

    // Get all campaigns
    const allCampaigns = await db
      .select()
      .from(campaigns)
      .orderBy(desc(campaigns.createdAt));

    console.log(`📊 Found ${allCampaigns.length} campaigns:\n`);

    if (allCampaigns.length === 0) {
      console.log('❌ No campaigns found in database');
      return;
    }

    // Check image status
    let withCoverImage = 0;
    let withGalleryImages = 0;
    let withDocuments = 0;
    let missingAll = 0;

    console.log('📋 Campaign Images Status:');
    allCampaigns.forEach((campaign, index) => {
      const hasCoverImage = campaign.coverImageUrl && campaign.coverImageUrl !== '';
      const hasGalleryImages = campaign.galleryImages && campaign.galleryImages !== '';
      const hasDocuments = campaign.documents && campaign.documents !== '';
      
      if (hasCoverImage) withCoverImage++;
      if (hasGalleryImages) withGalleryImages++;
      if (hasDocuments) withDocuments++;
      if (!hasCoverImage && !hasGalleryImages && !hasDocuments) missingAll++;

      console.log(`\n${index + 1}. ${campaign.title}`);
      console.log(`   Cover Image: ${hasCoverImage ? '✅' : '❌'} ${campaign.coverImageUrl || 'None'}`);
      console.log(`   Gallery Images: ${hasGalleryImages ? '✅' : '❌'} ${campaign.galleryImages || 'None'}`);
      console.log(`   Documents: ${hasDocuments ? '✅' : '❌'} ${campaign.documents || 'None'}`);
      console.log(`   Created: ${campaign.createdAt}`);
    });

    console.log(`\n📈 Summary:`);
    console.log(`Total campaigns: ${allCampaigns.length}`);
    console.log(`With cover image: ${withCoverImage}`);
    console.log(`With gallery images: ${withGalleryImages}`);
    console.log(`With documents: ${withDocuments}`);
    console.log(`Missing all images: ${missingAll}`);

  } catch (error) {
    console.error('❌ Error checking campaign images:', error);
  } finally {
    process.exit(0);
  }
}

checkCampaignImages();
