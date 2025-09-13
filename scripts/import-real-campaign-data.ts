#!/usr/bin/env tsx

import { db } from '../lib/db';
import { campaigns, users, donations } from '../lib/schema';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

interface CampaignData {
  campaignNumber: string;
  title: string;
  creatorName: string;
  beneficiary: string;
  category: string;
  story: string;
  currency: string;
  goalAmount: number;
  progress: number;
}

interface DonationData {
  donationNumber: string;
  campaignNumber: string;
  amount: number;
  donorName: string;
  status: 'completed' | 'failed' | 'pending';
  comment: string;
}

function parseCSV(content: string): any[] {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim()); // Add the last value
    
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    rows.push(row);
  }

  return rows;
}

function parseAmount(amountStr: string): number {
  if (!amountStr) return 0;
  // Remove commas and convert to number
  const cleaned = amountStr.replace(/,/g, '').replace(/"/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

function parseProgress(progressStr: string): number {
  if (!progressStr) return 0;
  // Remove % and convert to number
  const cleaned = progressStr.replace('%', '').replace(/"/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

async function importRealCampaignData() {
  try {
    // Read CSV file
    const csvPath = path.join(process.cwd(), 'campaigns-data.csv');
    
    if (!fs.existsSync(csvPath)) {
      return;
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const jsonData = parseCSV(csvContent);

    if (jsonData.length === 0) {
      return;
    }
        // Process campaigns and donations
    const campaignsMap = new Map<string, CampaignData>();
    const donationsList: DonationData[] = [];
    const creatorEmails = new Set<string>();
    let currentCampaignNumber = '';

    for (const row of jsonData) {
      const campaignNumber = row['C/No'];
      const donationNumber = row['D/No'];
      
      // Update current campaign number if we have one
      if (campaignNumber) {
        currentCampaignNumber = campaignNumber;
      }
      
      // Process campaign data (only for rows with campaign numbers)
      if (campaignNumber && row['Campaign Title']) {
        const goalAmount = parseAmount(row['Goal']);
        const progress = parseProgress(row['Progress']);
        
        // Generate email from creator name
        const creatorEmail = `${row['Creator'].toLowerCase().replace(/\s+/g, '.')}@example.com`;
        creatorEmails.add(creatorEmail);

        campaignsMap.set(campaignNumber, {
          campaignNumber,
          title: row['Campaign Title'],
          creatorName: row['Creator'],
          beneficiary: row['Beneficiary'],
          category: row['Category'],
          story: row['Campaign Story'],
          currency: row['Currency'],
          goalAmount,
          progress,
        });
      }

      // Process donation data (for all rows with donation numbers)
      if (donationNumber && row['Donation']) {
        const amount = parseAmount(row['Donation']);
        const status = row['Status']?.toLowerCase();
        
        if (amount > 0 && ['completed', 'failed', 'pending'].includes(status)) {
          donationsList.push({
            donationNumber,
            campaignNumber: currentCampaignNumber, // Use current campaign number
            amount,
            donorName: row['Donor'],
            status: status as 'completed' | 'failed' | 'pending',
            comment: row['Comment'] || '',
          });
        }
      }
    }

    // Create users for creators
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
        try {
          const newUser = await db.insert(users).values({
            email: email,
            fullName: email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            avatar: null,
            phone: null,
            isVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          }).returning();
          
          userMap.set(email, newUser[0].id);
        } catch (error) {
          console.log(`Failed to create creator: ${email}`);
        }
      }
    }

    // Import campaigns
    const campaignIdMap = new Map<string, string>();
    const importedCampaigns = [];

    for (const [campaignNumber, campaignData] of campaignsMap) {
      try {
        const creatorEmail = `${campaignData.creatorName.toLowerCase().replace(/\s+/g, '.')}@example.com`;
        const creatorId = userMap.get(creatorEmail);
        
        if (!creatorId) {
          continue;
        }

        // Calculate current amount from progress
        const currentAmount = (campaignData.goalAmount * campaignData.progress) / 100;

        const newCampaign = await db.insert(campaigns).values({
          creatorId,
          title: campaignData.title,
          subtitle: campaignData.beneficiary,
          description: campaignData.story,
          reason: campaignData.category,
          fundraisingFor: campaignData.beneficiary,
          duration: null,
          videoUrl: null,
          coverImageUrl: null,
          galleryImages: null,
          documents: null,
          goalAmount: campaignData.goalAmount.toString(),
          currency: campaignData.currency,
          minimumDonation: '10', // Default minimum
          chainerCommissionRate: '5.0', // Default commission rate
          currentAmount: currentAmount.toString(),
          status: 'active',
          isActive: true,
        }).returning();

        campaignIdMap.set(campaignNumber, newCampaign[0].id);
        importedCampaigns.push(newCampaign[0]);
      } catch (error) {
        console.log(`Failed to import campaign: ${campaignData.title} - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Import donations
    const importedDonations = [];
    const donationErrors = [];

    for (const donationData of donationsList) {
      try {
        const campaignId = campaignIdMap.get(donationData.campaignNumber);
        
        if (!campaignId) {
          donationErrors.push(`Campaign not found for donation ${donationData.donationNumber}`);
          continue;
        }

        // Create a donor user if needed
        const donorEmail = `${donationData.donorName.toLowerCase().replace(/\s+/g, '.')}@donor.com`;
        let donorId: string;
        
        const existingDonor = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, donorEmail))
          .limit(1);
        
        if (existingDonor.length > 0) {
          donorId = existingDonor[0].id;
        } else {
          const newDonor = await db.insert(users).values({
            email: donorEmail,
            fullName: donationData.donorName,
            avatar: null,
            phone: null,
            isVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          }).returning();
          donorId = newDonor[0].id;
        }

        const newDonation = await db.insert(donations).values({
          campaignId,
          donorId,
          amount: donationData.amount.toString(),
          currency: campaignsMap.get(donationData.campaignNumber)?.currency || 'USD',
          paymentMethod: 'imported',
          paymentStatus: donationData.status,
          message: donationData.comment,
          isAnonymous: donationData.donorName.toLowerCase().includes('anonymous'),
          processedAt: donationData.status === 'completed' ? new Date() : null,
        }).returning();

        importedDonations.push(newDonation[0]);
      } catch (error) {
        donationErrors.push(`Failed to import donation ${donationData.donationNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

      if (importedCampaigns.length > 0) {
      importedCampaigns.forEach(campaign => {
        console.log(`   • ${campaign.title} (ID: ${campaign.id})`);
      });
    }

    if (donationErrors.length > 0) {
      donationErrors.forEach(error => console.log(`   ${error}`));
    }

  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
importRealCampaignData();
