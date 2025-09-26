import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { NextRequest, NextResponse } from 'next/server';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.AWS_ENDPOINT_URL!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  try {
    console.log('R2 Upload: Starting upload process');
    const formData = await request.formData();
    const file = formData.get('imageUpload') as File || formData.get('documentUpload') as File;
    
    if (!file) {
      console.log('R2 Upload: No file provided');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('R2 Upload: File received:', file.name, file.size, file.type);

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}-${randomString}.${fileExtension}`;

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    });

    await s3Client.send(command);
    console.log('R2 Upload: File uploaded successfully to R2');

    // Return the URL - use the configured public access key URL
    const baseUrl = process.env.R2_PUBLIC_ACCESS_KEY;
    const fileUrl = `${baseUrl}/${fileName}`;
    console.log('R2 Upload: Generated URL:', fileUrl);
    
    return NextResponse.json({ 
      url: fileUrl,
      fileName: fileName 
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}