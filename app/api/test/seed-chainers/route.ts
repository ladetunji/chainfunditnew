import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chainers, users, campaigns } from '@/lib/schema';

export async function POST(request: NextRequest) {
  try {
    // First, get some existing users and campaigns
    const existingUsers = await db.select().from(users).limit(5);
    const existingCampaigns = await db.select().from(campaigns).limit(3);

    if (existingUsers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No users found. Please create users first.' },
        { status: 400 }
      );
    }

    if (existingCampaigns.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No campaigns found. Please create campaigns first.' },
        { status: 400 }
      );
    }

    // Generate test chainers
    const testChainers = [];
    
    for (let i = 0; i < 10; i++) {
      const user = existingUsers[i % existingUsers.length];
      const campaign = existingCampaigns[i % existingCampaigns.length];
      
      testChainers.push({
        userId: user.id,
        campaignId: campaign.id,
        referralCode: `REF${String(i + 1).padStart(3, '0')}${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        commissionDestination: 'keep',
        totalRaised: (Math.random() * 5000 + 1000).toFixed(2),
        totalReferrals: Math.floor(Math.random() * 50 + 1),
        clicks: Math.floor(Math.random() * 200 + 10),
        conversions: Math.floor(Math.random() * 20 + 1),
        commissionEarned: (Math.random() * 500 + 50).toFixed(2),
        commissionPaid: Math.random() > 0.5,
        // New ambassador fields
        status: ['active', 'suspended', 'banned'][Math.floor(Math.random() * 3)],
        commissionRate: (Math.random() * 10 + 2).toFixed(2),
        isVerified: Math.random() > 0.3,
        notes: Math.random() > 0.7 ? `Test notes for ambassador ${i + 1}` : null,
        suspendedAt: Math.random() > 0.8 ? new Date() : null,
        suspendedReason: Math.random() > 0.8 ? 'Test suspension reason' : null,
        lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      });
    }

    // Insert test chainers
    const insertedChainers = await db.insert(chainers).values(testChainers).returning();

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${insertedChainers.length} chainers`,
      chainers: insertedChainers.slice(0, 3).map(chainer => ({
        referralCode: chainer.referralCode,
        totalRaised: chainer.totalRaised,
        totalReferrals: chainer.totalReferrals,
        status: chainer.status,
        commissionRate: chainer.commissionRate,
        isVerified: chainer.isVerified,
      }))
    });

  } catch (error) {
    console.error('❌ Error seeding chainers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to seed chainers' },
      { status: 500 }
    );
  }
}
