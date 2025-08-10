import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns, users, donations } from '@/lib/schema';
import { eq, and, count, sum } from 'drizzle-orm';
import { parse } from 'cookie';
import { verifyUserJWT } from '@/lib/auth';

async function getUserFromRequest(request: NextRequest) {
  const cookie = request.headers.get('cookie') || '';
  const cookies = parse(cookie);
  const token = cookies['auth_token'];
  if (!token) return null;
  const userPayload = verifyUserJWT(token);
  if (!userPayload || !userPayload.email) return null;
  return userPayload.email;
}

// GET /api/campaigns - Get all campaigns with filtering
export async function GET(request: NextRequest) {
  try {
    console.log('API: GET /api/campaigns - Starting request');
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const reason = searchParams.get('reason');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const creatorId = searchParams.get('creatorId');

    console.log('API: GET /api/campaigns - Query params:', { status, reason, limit, offset, creatorId });

    // Build query with filters
    let conditions = [];
    if (status) {
      conditions.push(eq(campaigns.status, status));
    }
    if (reason) {
      conditions.push(eq(campaigns.reason, reason));
    }
    if (creatorId) {
      conditions.push(eq(campaigns.creatorId, creatorId));
    }
    
    console.log('API: GET /api/campaigns - Conditions:', conditions.length);
    
    // Get campaigns with creator details and donation stats
    const campaignsWithDetails = await db
      .select({
        id: campaigns.id,
        title: campaigns.title,
        subtitle: campaigns.subtitle,
        description: campaigns.description,
        reason: campaigns.reason,
        fundraisingFor: campaigns.fundraisingFor,
        duration: campaigns.duration,
        videoUrl: campaigns.videoUrl,
        coverImageUrl: campaigns.coverImageUrl,
        galleryImages: campaigns.galleryImages,
        documents: campaigns.documents,
        goalAmount: campaigns.goalAmount,
        currency: campaigns.currency,
        minimumDonation: campaigns.minimumDonation,
        chainerCommissionRate: campaigns.chainerCommissionRate,
        currentAmount: campaigns.currentAmount,
        status: campaigns.status,
        isActive: campaigns.isActive,
        createdAt: campaigns.createdAt,
        updatedAt: campaigns.updatedAt,
        closedAt: campaigns.closedAt,
        creatorId: campaigns.creatorId,
        creatorName: users.fullName,
        creatorAvatar: users.avatar,
      })
      .from(campaigns)
      .leftJoin(users, eq(campaigns.creatorId, users.id))
      .where(conditions.length > 0 ? conditions.reduce((acc, condition) => acc && condition) : undefined)
      .limit(limit)
      .offset(offset);

    console.log('API: GET /api/campaigns - Found campaigns:', campaignsWithDetails.length);

    // Get donation stats for each campaign
    const campaignsWithStats = await Promise.all(
      campaignsWithDetails.map(async (campaign) => {
        const donationStats = await db
          .select({
            totalDonations: count(donations.id),
            totalAmount: sum(donations.amount),
            uniqueDonors: count(donations.donorId),
          })
          .from(donations)
          .where(and(
            eq(donations.campaignId, campaign.id),
            eq(donations.paymentStatus, 'completed')
          ));

        const stats = {
          totalDonations: Number(donationStats[0]?.totalDonations || 0),
          totalAmount: Number(donationStats[0]?.totalAmount || 0),
          uniqueDonors: Number(donationStats[0]?.uniqueDonors || 0),
          progressPercentage: Math.min(100, Math.round((Number(campaign.currentAmount) / Number(campaign.goalAmount)) * 100)),
        };

        return {
          ...campaign,
          goalAmount: Number(campaign.goalAmount),
          currentAmount: Number(campaign.currentAmount),
          minimumDonation: Number(campaign.minimumDonation),
          chainerCommissionRate: Number(campaign.chainerCommissionRate),
          galleryImages: campaign.galleryImages ? JSON.parse(campaign.galleryImages) : [],
          documents: campaign.documents ? JSON.parse(campaign.documents) : [],
          stats,
        };
      })
    );
    
    console.log('API: GET /api/campaigns - Returning campaigns with stats:', campaignsWithStats.length);
    
    return NextResponse.json({
      success: true,
      data: campaignsWithStats,
      pagination: {
        limit,
        offset,
        total: campaignsWithStats.length,
      },
    });
  } catch (error) {
    console.error('API: GET /api/campaigns - Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

// POST /api/campaigns - Create a new campaign
export async function POST(request: NextRequest) {
  try {
    // TODO: Re-enable authentication later
    // For now, create or get a mock user for testing
    const mockUserEmail = 'mock-user@example.com';
    const mockUserName = 'Mock User';
    
    // Check if mock user exists, create if not
    let [existingUser] = await db.select().from(users).where(eq(users.email, mockUserEmail)).limit(1);
    let creatorId: string;
    
    if (!existingUser) {
      const [newUser] = await db.insert(users).values({
        email: mockUserEmail,
        fullName: mockUserName,
        hasCompletedProfile: true,
      }).returning();
      creatorId = newUser.id;
    } else {
      creatorId = existingUser.id;
    }
    
    const formData = await request.formData();

    const title = formData.get('title') as string;
    const subtitle = formData.get('subtitle') as string;
    const reason = formData.get('reason') as string;
    const fundraisingFor = formData.get('fundraisingFor') as string;
    const duration = formData.get('duration') as string;
    const video = formData.get('video') as string;
    const story = formData.get('story') as string;
    const goalRaw = formData.get('goal') as string;
    const currency = formData.get('currency') as string;
    const visibility = formData.get('visibility') as string;

    const imageFiles = formData.getAll('images').filter((f): f is File => f instanceof File && f.name);
    const documentFiles = formData.getAll('documents').filter((f): f is File => f instanceof File && f.name);
    const coverImageFile = formData.get('coverImage') as File | null;
    const validCoverImageFile = coverImageFile && coverImageFile.name ? coverImageFile : null;

    // Validate required fields
    if (!title || !story || !goalRaw || !currency) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields',
          required: ['title', 'story', 'goal', 'currency'],
          received: {
            title: !!title,
            story: !!story,
            goal: !!goalRaw,
            currency: !!currency
          }
        },
        { status: 400 }
      );
    }

    const goalAmount = parseFloat(goalRaw);
    if (isNaN(goalAmount) || goalAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid goal amount' },
        { status: 400 }
      );
    }

    // Validate file types and sizes
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const validDocTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const maxImageSize = 1024 * 1024; // 1MB
    const maxDocSize = 10 * 1024 * 1024; // 10MB

    const isValidImage = (file: File) => validImageTypes.includes(file.type) && file.size <= maxImageSize;
    const isValidDoc = (file: File) => validDocTypes.includes(file.type) && file.size <= maxDocSize;

    if (imageFiles.length > 0 && !imageFiles.every(isValidImage)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid image file type or size (max 1MB per image)' 
      }, { status: 400 });
    }

    if (documentFiles.length > 0 && !documentFiles.every(isValidDoc)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid document file type or size (max 10MB per document)' 
      }, { status: 400 });
    }

    if (imageFiles.length > 5) {
      return NextResponse.json({ 
        success: false, 
        error: 'Maximum 5 images allowed' 
      }, { status: 400 });
    }

    if (documentFiles.length > 3) {
      return NextResponse.json({ 
        success: false, 
        error: 'Maximum 3 documents allowed' 
      }, { status: 400 });
    }

    // TODO: In production, upload files to cloud storage (AWS S3, Cloudinary, etc.)
    // For now, we'll use placeholder images since file upload isn't fully implemented
    const imagePaths = imageFiles.length > 0 
      ? ["/images/card-img1.png", "/images/card-img2.png", "/images/card-img3.png"].slice(0, imageFiles.length)
      : [];
    const documentPaths = documentFiles.length > 0 
      ? ["/documents/sample-document.pdf"].slice(0, documentFiles.length)
      : [];
    const coverImagePath = validCoverImageFile ? "/images/card-img1.png" : null;

    // Log uploaded files for debugging
    console.log('Uploaded images:', imageFiles.map(f => f.name));
    console.log('Uploaded documents:', documentFiles.map(f => f.name));
    console.log('Cover image:', validCoverImageFile?.name);
    console.log('Generated image paths:', imagePaths);
    console.log('Generated document paths:', documentPaths);
    console.log('Generated cover image path:', coverImagePath);

    const newCampaign = await db.insert(campaigns).values({
      creatorId,
      title,
      subtitle: subtitle || null,
      description: story,
      reason: reason || null,
      fundraisingFor: fundraisingFor || null,
      duration: duration || null,
      videoUrl: video || null,
      coverImageUrl: coverImagePath,
      galleryImages: imagePaths.length > 0 ? JSON.stringify(imagePaths) : null,
      documents: documentPaths.length > 0 ? JSON.stringify(documentPaths) : null,
      goalAmount: goalAmount.toString(),
      currency,
      minimumDonation: '0',
      chainerCommissionRate: '5.0',
      currentAmount: '0',
      status: 'active',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json({
      success: true,
      data: newCampaign[0],
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create campaign', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}