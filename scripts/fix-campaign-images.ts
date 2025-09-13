import { db } from '../lib/db';
import { campaigns } from '../lib/schema/campaigns';
import { eq, isNull } from 'drizzle-orm';

async function fixCampaignImages() {
  try {
    console.log('🔧 Fixing campaign images...\n');

    // Get campaigns with missing cover images
    const campaignsWithMissingImages = await db
      .select()
      .from(campaigns)
      .where(isNull(campaigns.coverImageUrl));

    console.log(`📊 Found ${campaignsWithMissingImages.length} campaigns with missing cover images\n`);

    if (campaignsWithMissingImages.length === 0) {
      console.log('✅ All campaigns have cover images');
      return;
    }

    let fixedCount = 0;

    for (const campaign of campaignsWithMissingImages) {
      try {
        console.log(`🔍 Fixing campaign: ${campaign.title}`);
        
        // Set placeholder cover image
        const placeholderCoverImage = '/images/card-img1.png';
        
        // Set placeholder gallery images
        const placeholderGalleryImages = JSON.stringify(['/images/card-img1.png']);
        
        // Set placeholder documents
        const placeholderDocuments = JSON.stringify(['/documents/sample-document.pdf']);

        // Update campaign
        await db
          .update(campaigns)
          .set({
            coverImageUrl: placeholderCoverImage,
            galleryImages: placeholderGalleryImages,
            documents: placeholderDocuments,
            updatedAt: new Date(),
          })
          .where(eq(campaigns.id, campaign.id));

        console.log(`✅ Fixed campaign: ${campaign.title}`);
        fixedCount++;
      } catch (error) {
        console.error(`❌ Error fixing campaign ${campaign.id}:`, error);
      }
    }

    console.log(`\n📈 Summary:`);
    console.log(`✅ Fixed: ${fixedCount} campaigns`);
    console.log(`❌ Errors: ${campaignsWithMissingImages.length - fixedCount} campaigns`);

  } catch (error) {
    console.error('❌ Error fixing campaign images:', error);
  } finally {
    process.exit(0);
  }
}

fixCampaignImages();
