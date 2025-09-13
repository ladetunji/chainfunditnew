import { writeFile } from 'fs/promises';
import { join } from 'path';

async function testUpload() {
  try {
    console.log('🧪 Testing file upload functionality...\n');

    // Create a test image file
    const testImagePath = join(process.cwd(), 'test-image.jpg');
    const testImageData = Buffer.from('fake-image-data-for-testing');
    await writeFile(testImagePath, testImageData);

    console.log('✅ Test image created');

    // Test R2 upload
    console.log('\n🔍 Testing R2 upload...');
    try {
      const formData = new FormData();
      formData.append('imageUpload', new Blob([testImageData], { type: 'image/jpeg' }), 'test.jpg');

      const response = await fetch('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ R2 upload successful:', result.url);
      } else {
        const error = await response.json();
        console.log('❌ R2 upload failed:', error.error);
      }
    } catch (error) {
      console.log('❌ R2 upload error:', error);
    }

    // Test local upload
    console.log('\n🔍 Testing local upload...');
    try {
      const formData = new FormData();
      formData.append('imageUpload', new Blob([testImageData], { type: 'image/jpeg' }), 'test.jpg');

      const response = await fetch('http://localhost:3000/api/upload-local', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Local upload successful:', result.url);
      } else {
        const error = await response.json();
        console.log('❌ Local upload failed:', error.error);
      }
    } catch (error) {
      console.log('❌ Local upload error:', error);
    }

    console.log('\n📋 Environment Variables Check:');
    const requiredVars = [
      'AWS_ENDPOINT_URL',
      'R2_ACCESS_KEY', 
      'R2_SECRET_ACCESS_KEY',
      'S3_BUCKET_NAME',
      'R2_ACCOUNT_ID'
    ];

    requiredVars.forEach(varName => {
      const value = process.env[varName];
      console.log(`${varName}: ${value ? '✅ Set' : '❌ Missing'}`);
    });

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    process.exit(0);
  }
}

testUpload();
