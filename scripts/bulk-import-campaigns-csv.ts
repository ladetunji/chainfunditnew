#!/usr/bin/env tsx

import { db } from '../lib/db';
import { campaigns, users } from '../lib/schema';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

interface CampaignData {
  title: string;
  subtitle?: string;
  description: string;
  reason?: string;
  fundraisingFor?: string;
  duration?: string;
  goalAmount: number;
  currency: string;
  minimumDonation: number;
  chainerCommissionRate: number;
  videoUrl?: string;
  coverImageUrl?: string;
  galleryImages?: string[];
  documents?: string[];
  creatorEmail: string;
}

function parseCSV(content: string): any[] {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const row: any = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    rows.push(row);
  }

  return rows;
}

async function bulkImportCampaignsCSV() {
  console.log('📊 Bulk Importing Campaigns from CSV...\n');

  try {
    // Check if CSV file exists
    const csvPath = path.join(process.cwd(), 'campaigns-data.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.log('❌ CSV file not found!');
      console.log('📋 Please create a file named "campaigns-data.csv" in the project root with the following columns:');
      console.log('   • title (required)');
      console.log('   • subtitle (optional)');
      console.log('   • description (required)');
      console.log('   • reason (optional)');
      console.log('   • fundraisingFor (optional)');
      console.log('   • duration (optional)');
      console.log('   • goalAmount (required)');
      console.log('   • currency (required)');
      console.log('   • minimumDonation (required)');
      console.log('   • chainerCommissionRate (required)');
      console.log('   • videoUrl (optional)');
      console.log('   • coverImageUrl (optional)');
      console.log('   • galleryImages (optional, comma-separated URLs)');
      console.log('   • documents (optional, comma-separated URLs)');
      console.log('   • creatorEmail (required)');
      console.log('\n💡 Example CSV format:');
      console.log('title,description,goalAmount,currency,minimumDonation,chainerCommissionRate,creatorEmail');
      console.log('"Save the Planet","Help save our environment",10000,"NGN",100,5.0,"admin@example.com"');
      return;
    }

    // Read CSV file
    console.log('📖 Reading CSV file...');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const jsonData = parseCSV(csvContent);

    if (jsonData.length === 0) {
      console.log('❌ No data found in CSV file');
      return;
    }

    console.log(`📋 Found ${jsonData.length} rows of data`);

    // Validate and process each row
    const validCampaigns: CampaignData[] = [];
    const errors: string[] = [];

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowNum = i + 2; // +2 because CSV is 1-indexed and we skip header

      try {
        // Validate required fields
        if (!row.title) {
          errors.push(`Row ${rowNum}: Missing title`);
          continue;
        }
        if (!row.description) {
          errors.push(`Row ${rowNum}: Missing description`);
          continue;
        }
        if (!row.goalAmount || isNaN(parseFloat(row.goalAmount))) {
          errors.push(`Row ${rowNum}: Invalid goalAmount`);
          continue;
        }
        if (!row.currency) {
          errors.push(`Row ${rowNum}: Missing currency`);
          continue;
        }
        if (!row.minimumDonation || isNaN(parseFloat(row.minimumDonation))) {
          errors.push(`Row ${rowNum}: Invalid minimumDonation`);
          continue;
        }
        if (!row.chainerCommissionRate || isNaN(parseFloat(row.chainerCommissionRate))) {
          errors.push(`Row ${rowNum}: Invalid chainerCommissionRate`);
          continue;
        }
        if (!row.creatorEmail) {
          errors.push(`Row ${rowNum}: Missing creatorEmail`);
          continue;
        }

        // Parse arrays
        const galleryImages = row.galleryImages ? 
          row.galleryImages.split(',').map((url: string) => url.trim()).filter((url: string) => url) : 
          [];
        
        const documents = row.documents ? 
          row.documents.split(',').map((url: string) => url.trim()).filter((url: string) => url) : 
          [];

        const campaignData: CampaignData = {
          title: row.title.trim(),
          subtitle: row.subtitle?.trim() || undefined,
          description: row.description.trim(),
          reason: row.reason?.trim() || undefined,
          fundraisingFor: row.fundraisingFor?.trim() || undefined,
          duration: row.duration?.trim() || undefined,
          goalAmount: parseFloat(row.goalAmount),
          currency: row.currency.trim(),
          minimumDonation: parseFloat(row.minimumDonation),
          chainerCommissionRate: parseFloat(row.chainerCommissionRate),
          videoUrl: row.videoUrl?.trim() || undefined,
          coverImageUrl: row.coverImageUrl?.trim() || undefined,
          galleryImages: galleryImages.length > 0 ? galleryImages : undefined,
          documents: documents.length > 0 ? documents : undefined,
          creatorEmail: row.creatorEmail.trim(),
        };

        validCampaigns.push(campaignData);
      } catch (error) {
        errors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Show validation results
    if (errors.length > 0) {
      console.log('\n❌ Validation Errors:');
      errors.forEach(error => console.log(`   ${error}`));
      console.log(`\n📊 ${validCampaigns.length} valid campaigns found`);
      
      if (validCampaigns.length === 0) {
        console.log('❌ No valid campaigns to import');
        return;
      }
    }

    // Get unique creator emails
    const creatorEmails = [...new Set(validCampaigns.map(c => c.creatorEmail))];
    console.log(`\n👥 Found ${creatorEmails.length} unique creators`);

    // Verify all creators exist, create if they don't
    console.log('🔍 Verifying creators exist...');
    const userMap = new Map<string, string>();
    
    for (const email of creatorEmails) {
      const user = await db
        .select({ email: users.email, id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      
      if (user.length > 0) {
        userMap.set(email, user[0].id);
        console.log(`   ✅ Found creator: ${email}`);
      } else {
        // Create the user
        console.log(`   🔨 Creating new user: ${email}`);
        try {
          const newUser = await db.insert(users).values({
            email: email,
            fullName: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Generate name from email
            avatar: null,
            phone: null,
            isVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          }).returning();
          
          userMap.set(email, newUser[0].id);
          console.log(`   ✅ Created user: ${email} (ID: ${newUser[0].id})`);
        } catch (error) {
          console.log(`❌ Failed to create user: ${email} - ${error instanceof Error ? error.message : 'Unknown error'}`);
          return;
        }
      }
    }

    console.log('✅ All creators verified');

    // Import campaigns
    console.log('\n📥 Importing campaigns...');
    const importedCampaigns = [];
    const importErrors = [];

    for (const campaignData of validCampaigns) {
      try {
        const creatorId = userMap.get(campaignData.creatorEmail);
        if (!creatorId) {
          importErrors.push(`Creator not found for email: ${campaignData.creatorEmail}`);
          continue;
        }

        const newCampaign = await db.insert(campaigns).values({
          creatorId,
          title: campaignData.title,
          subtitle: campaignData.subtitle || null,
          description: campaignData.description,
          reason: campaignData.reason || null,
          fundraisingFor: campaignData.fundraisingFor || null,
          duration: campaignData.duration || null,
          videoUrl: campaignData.videoUrl || null,
          coverImageUrl: campaignData.coverImageUrl || null,
          galleryImages: campaignData.galleryImages ? JSON.stringify(campaignData.galleryImages) : null,
          documents: campaignData.documents ? JSON.stringify(campaignData.documents) : null,
          goalAmount: campaignData.goalAmount.toString(),
          currency: campaignData.currency,
          minimumDonation: campaignData.minimumDonation.toString(),
          chainerCommissionRate: campaignData.chainerCommissionRate.toString(),
          currentAmount: '0',
          status: 'active',
          isActive: true,
        }).returning();

        importedCampaigns.push(newCampaign[0]);
        console.log(`   ✅ Imported: ${campaignData.title}`);
      } catch (error) {
        const errorMsg = `Failed to import "${campaignData.title}": ${error instanceof Error ? error.message : 'Unknown error'}`;
        importErrors.push(errorMsg);
        console.log(`   ❌ ${errorMsg}`);
      }
    }

    // Summary
    console.log('\n🎉 Import Complete!');
    console.log(`📊 Summary:`);
    console.log(`   • Total rows processed: ${jsonData.length}`);
    console.log(`   • Valid campaigns: ${validCampaigns.length}`);
    console.log(`   • Successfully imported: ${importedCampaigns.length}`);
    console.log(`   • Errors: ${errors.length + importErrors.length}`);

    if (importedCampaigns.length > 0) {
      console.log('\n✅ Successfully imported campaigns:');
      importedCampaigns.forEach(campaign => {
        console.log(`   • ${campaign.title} (ID: ${campaign.id})`);
      });
    }

    if (importErrors.length > 0) {
      console.log('\n❌ Import errors:');
      importErrors.forEach(error => console.log(`   ${error}`));
    }

  } catch (error) {
    console.error('❌ Bulk import failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
bulkImportCampaignsCSV();
