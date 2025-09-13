#!/usr/bin/env tsx

import { db } from '../lib/db';
import { campaigns, users } from '../lib/schema';
import { eq } from 'drizzle-orm';
import * as XLSX from 'xlsx';
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
  creatorEmail: string; // We'll use email to find the creator
}

async function bulkImportCampaigns() {

  try {
    // Check if Excel file exists
    const excelPath = path.join(process.cwd(), 'campaigns-data.xlsx');
    
    if (!fs.existsSync(excelPath)) {
      return;
    }

    // Read Excel file
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      return;
    }


    // Validate and process each row
    const validCampaigns: CampaignData[] = [];
    const errors: string[] = [];

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i] as any;
      const rowNum = i + 2; // +2 because Excel is 1-indexed and we skip header

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
      errors.forEach(error => console.log(`   ${error}`));
      
      if (validCampaigns.length === 0) {
        return;
      }
    }

    // Get unique creator emails
    const creatorEmails = [...new Set(validCampaigns.map(c => c.creatorEmail))];

    // Verify all creators exist, create if they don't
    const userMap = new Map<string, string>();
    
    for (const email of creatorEmails) {
      const user = await db
        .select({ email: users.email, id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      
      if (user.length > 0) {
        userMap.set(email, user[0].id);
      } else {
        // Create the user
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
        } catch (error) {
          console.log(`Failed to create user: ${email} - ${error instanceof Error ? error.message : 'Unknown error'}`);
          return;
        }
      }
    }

    // Import campaigns
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
      } catch (error) {
        const errorMsg = `Failed to import "${campaignData.title}": ${error instanceof Error ? error.message : 'Unknown error'}`;
        importErrors.push(errorMsg);
      }
    }

    if (importedCampaigns.length > 0) {
      importedCampaigns.forEach(campaign => {
        console.log(`${campaign.title} (ID: ${campaign.id})`);
      });
    }

    if (importErrors.length > 0) {
      importErrors.forEach(error => console.log(`   ${error}`));
    }

  } catch (error) {
    console.error('❌ Bulk import failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
bulkImportCampaigns();
