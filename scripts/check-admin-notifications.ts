#!/usr/bin/env tsx

/**
 * Admin Notification Diagnostic Script
 * 
 * This script checks if admin notifications are properly configured
 * and helps diagnose why notifications might not be working.
 * 
 * Usage: npm run check-admin-notifications
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

async function checkAdminNotifications() {
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

    // Check admin settings
    const allSettings = await db.query.adminSettings.findMany();

    if (allSettings.length === 0) {
    } else {
      allSettings.forEach(setting => {
        const adminUser = adminUsers.find(u => u.id === setting.userId);
      });
    }

    // Check for potential issues
    let issuesFound = 0;

    if (!process.env.RESEND_API_KEY) {
      issuesFound++;
    }

    if (!process.env.ADMIN_EMAIL) {
      issuesFound++;
    }

    if (adminUsers.length > 0 && allSettings.length === 0) {
      issuesFound++;
    }

    // Check each admin user
    for (const adminUser of adminUsers) {
      const setting = allSettings.find(s => s.userId === adminUser.id);
      
      if (!setting) {
        continue;
      }

      if (!setting.emailNotificationsEnabled) {
        continue;
      }

      if (!setting.notifyOnPayoutRequest) {
        continue;
      }

      const recipientEmail = setting.notificationEmail || process.env.ADMIN_EMAIL;
      if (!recipientEmail) {
        issuesFound++;
      }
    }

    if (issuesFound === 0) {
    } else {
    }

  } catch (error) {
    process.exit(1);
  }
}

// Run the script
checkAdminNotifications();
