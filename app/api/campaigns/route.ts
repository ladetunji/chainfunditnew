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
    const description = formData.get('description') as string;
    const goalAmountRaw = formData.get('goalAmount') as string;
    const currency = formData.get('currency') as string;
    const minimumDonationRaw = formData.get('minimumDonation') as string;
    const chainerCommissionRateRaw = formData.get('chainerCommissionRate') as string;

    const imageFiles = formData.getAll('images').filter((f): f is File => f instanceof File);
    const documentFiles = formData.getAll('documents').filter((f): f is File => f instanceof File);

    // Validate file types and simulate file path generation
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const validDocTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    const isValidImage = (file: File) => validImageTypes.includes(file.type);
    const isValidDoc = (file: File) => validDocTypes.includes(file.type);

    if (!imageFiles.every(isValidImage)) {
      return NextResponse.json({ success: false, error: 'Invalid image file type' }, { status: 400 });
    }

    if (!documentFiles.every(isValidDoc)) {
      return NextResponse.json({ success: false, error: 'Invalid document file type' }, { status: 400 });
    }

    const imagePaths = imageFiles.map((file) => `/uploads/${file.name}`);
    const documentPaths = documentFiles.map((file) => `/uploads/${file.name}`);

    // Optional: Log file names for now
    console.log('Uploaded images:', imageFiles.map(f => f.name));
    console.log('Uploaded documents:', documentFiles.map(f => f.name));

    if (!title || !description || !goalAmountRaw || !currency) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const goalAmount = parseFloat(goalAmountRaw);
    if (isNaN(goalAmount) || goalAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing goal amount' },
        { status: 400 }
      );
    }

    const minimumDonation = parseFloat(minimumDonationRaw || '0');
    const chainerCommissionRate = parseFloat(chainerCommissionRateRaw || '5.0');

    if (chainerCommissionRate < 1 || chainerCommissionRate > 10) {
      return NextResponse.json(
        { success: false, error: 'Commission rate must be between 1% and 10%' },
        { status: 400 }
      );
    }

    const newCampaign = await db.insert(campaigns).values({
      creatorId,
      title,
      description,
      goalAmount: goalAmount.toString(),
      currency,
      minimumDonation: minimumDonation.toString(),
      chainerCommissionRate: chainerCommissionRate.toString(),
      currentAmount: '0',
      status: 'active',
      galleryImages: JSON.stringify(imagePaths),
      documents: JSON.stringify(documentPaths),
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
      { success: false, error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}