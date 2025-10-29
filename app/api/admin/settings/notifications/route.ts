import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adminSettings, type NewAdminSettings } from '@/lib/schema/admin-settings';
import { eq } from 'drizzle-orm';
import { getAdminUser } from '@/lib/admin-auth';

/**
 * GET /api/admin/settings/notifications
 * Get admin notification settings
 */
export async function GET(request: NextRequest) {
  try {
    // Get current admin user from session
    const adminUser = await getAdminUser(request);
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    let settings = await db.query.adminSettings.findFirst({
      where: eq(adminSettings.userId, adminUser.id),
    });

    // Helper function to serialize settings for JSON response
    const serializeSettings = (settings: any) => {
      return {
        ...settings,
        createdAt: settings.createdAt instanceof Date 
          ? settings.createdAt.toISOString() 
          : settings.createdAt,
        updatedAt: settings.updatedAt instanceof Date 
          ? settings.updatedAt.toISOString() 
          : settings.updatedAt,
      };
    };

    // If no settings exist, create default ones
    if (!settings) {
      const [newSettings] = await db
        .insert(adminSettings)
        .values({
          userId: adminUser.id,
          emailNotificationsEnabled: true,
          notifyOnCharityDonation: true,
          notifyOnCampaignDonation: true,
          notifyOnPayoutRequest: true,
          notifyOnLargeDonation: true,
          largeDonationThreshold: '1000',
          pushNotificationsEnabled: false,
          dailySummaryEnabled: false,
          weeklySummaryEnabled: true,
          summaryTime: '09:00',
        })
        .returning();
      
      settings = newSettings;
    }

    return NextResponse.json({ settings: serializeSettings(settings) });
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/settings/notifications
 * Update admin notification settings
 */
export async function PATCH(request: NextRequest) {
  try {
    // Get current admin user from session
    const adminUser = await getAdminUser(request);
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Filter out fields that shouldn't be updated
    const {
      id,
      userId,
      createdAt,
      updatedAt,
      ...updateableFields
    } = body;

    // Find existing settings
    const existing = await db.query.adminSettings.findFirst({
      where: eq(adminSettings.userId, adminUser.id),
    });

    // Helper function to serialize settings for JSON response
    const serializeSettings = (settings: any) => {
      return {
        ...settings,
        createdAt: settings.createdAt instanceof Date 
          ? settings.createdAt.toISOString() 
          : settings.createdAt,
        updatedAt: settings.updatedAt instanceof Date 
          ? settings.updatedAt.toISOString() 
          : settings.updatedAt,
      };
    };

    if (existing) {
      // Update existing settings
      const [updated] = await db
        .update(adminSettings)
        .set({
          ...updateableFields,
          updatedAt: new Date(),
        })
        .where(eq(adminSettings.userId, adminUser.id))
        .returning();

      return NextResponse.json({
        message: 'Settings updated successfully',
        settings: serializeSettings(updated),
      });
    } else {
      // Create new settings
      const [created] = await db
        .insert(adminSettings)
        .values({
          userId: adminUser.id,
          ...updateableFields,
        })
        .returning();

      return NextResponse.json({
        message: 'Settings created successfully',
        settings: serializeSettings(created),
      });
    }
  } catch (error) {
    console.error('Error updating admin settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

