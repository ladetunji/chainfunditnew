import { db } from '../lib/db';
import { campaigns } from '../lib/schema/campaigns';
import { eq, isNull } from 'drizzle-orm';

async function fixCampaignImages() {
  try {
    // Get campaigns with missing cover images
    const campaignsWithMissingImages = await db
      .select()
      .from(campaigns)
      .where(isNull(campaigns.coverImageUrl));

    if (campaignsWithMissingImages.length === 0) {
      return;
    }

    let fixedCount = 0;

    for (const campaign of campaignsWithMissingImages) {
      try {
        
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

        fixedCount++;
      } catch (error) {
        console.error(`Error fixing campaign ${campaign.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error fixing campaign images:', error);
  } finally {
    process.exit(0);
  }
}

fixCampaignImages();
