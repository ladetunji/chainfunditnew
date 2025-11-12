#!/usr/bin/env tsx

/**
 * Setup Admin Notifications Script
 * 
 * This script creates default admin notification settings for all existing admin users
 * who don't already have settings configured.
 * 
 * Usage: npm run setup-admin-notifications
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';

// Try to load .env.local first, then .env
const envPath = resolve(process.cwd(), '.env.local');
config({ path: envPath });
config({ path: resolve(process.cwd(), '.env') });

import { db } from '../lib/db';
import { users } from '../lib/schema';
import { adminSettings } from '../lib/schema/admin-settings';
import { eq, or } from 'drizzle-orm';

async function setupAdminNotifications() {
  try {
    // Get all admin users
    const adminUsers = await db.query.users.findMany({
      where: or(
        eq(users.role, 'admin'),
        eq(users.role, 'super_admin')
      ),
    });

    if (adminUsers.length === 0) {
      return;
    }

    adminUsers.forEach(user => {
    });

    // Check existing admin settings
    const existingSettings = await db.query.adminSettings.findMany();
    const existingUserIds = new Set(existingSettings.map(s => s.userId));

    
    let settingsCreated = 0;
    let settingsUpdated = 0;

    for (const adminUser of adminUsers) {
      if (existingUserIds.has(adminUser.id)) {
        continue;
      }

      // Create default settings for this admin
      const [newSettings] = await db
        .insert(adminSettings)
        .values({
          userId: adminUser.id,
          emailNotificationsEnabled: true,
          notifyOnCharityDonation: true,
          notifyOnCampaignDonation: true,
          notifyOnPayoutRequest: true,
          notifyOnLargeDonation: true,
          notifyOnAccountChangeRequest: true,
          largeDonationThreshold: '1000',
          pushNotificationsEnabled: false,
          dailySummaryEnabled: false,
          weeklySummaryEnabled: true,
          summaryTime: '09:00',
        })
        .returning();

      settingsCreated++;
    }
    
  } catch (error) {
    process.exit(1);
  }
}

// Run the script
setupAdminNotifications();
