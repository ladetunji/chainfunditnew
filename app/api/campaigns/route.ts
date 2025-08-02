import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns } from '@/lib/schema/campaigns';
import { eq } from 'drizzle-orm';

// GET /api/campaigns - Get all campaigns
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    let allCampaigns;
    
    if (status) {
      allCampaigns = await db.select().from(campaigns).where(eq(campaigns.status, status)).limit(limit).offset(offset);
    } else {
      allCampaigns = await db.select().from(campaigns).limit(limit).offset(offset);
    }
    
    return NextResponse.json({
      success: true,
      data: allCampaigns,
      pagination: {
        limit,
        offset,
        total: allCampaigns.length,
      },
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

// POST /api/campaigns - Create a new campaign
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const creatorId = '8f63c466-782a-4d09-a2ae-bd5bced60d10'; // TODO: Replace with auth-derived user ID
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

    const imageFiles = formData.getAll('images').filter((f): f is File => f instanceof File);
    const documentFiles = formData.getAll('documents').filter((f): f is File => f instanceof File);
    const coverImageFile = formData.get('coverImage') as File | null;

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

    // Validate file types
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const validDocTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    const isValidImage = (file: File) => validImageTypes.includes(file.type);
    const isValidDoc = (file: File) => validDocTypes.includes(file.type);

    if (imageFiles.length > 0 && !imageFiles.every(isValidImage)) {
      return NextResponse.json({ success: false, error: 'Invalid image file type' }, { status: 400 });
    }

    if (documentFiles.length > 0 && !documentFiles.every(isValidDoc)) {
      return NextResponse.json({ success: false, error: 'Invalid document file type' }, { status: 400 });
    }

    // Generate file paths (in production, you'd upload to cloud storage)
    const imagePaths = imageFiles.map((file) => `/uploads/${file.name}`);
    const documentPaths = documentFiles.map((file) => `/uploads/${file.name}`);
    const coverImagePath = coverImageFile ? `/uploads/${coverImageFile.name}` : null;

    // Log uploaded files for debugging
    console.log('Uploaded images:', imageFiles.map(f => f.name));
    console.log('Uploaded documents:', documentFiles.map(f => f.name));
    console.log('Cover image:', coverImageFile?.name);

    const newCampaign = await db.insert(campaigns).values({
      creatorId,
      title,
      subtitle: subtitle || null,
      description: story, // Using story as description
      reason: reason || null,
      fundraisingFor: fundraisingFor || null,
      duration: duration || null,
      videoUrl: video || null,
      coverImageUrl: coverImagePath,
      galleryImages: imagePaths.length > 0 ? JSON.stringify(imagePaths) : null,
      documents: documentPaths.length > 0 ? JSON.stringify(documentPaths) : null,
      goalAmount: goalAmount.toString(),
      currency,
      minimumDonation: '0', // Default minimum donation
      chainerCommissionRate: '5.0', // Default commission rate
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