import { useState } from 'react';

export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadFile = async (file: File, type: 'imageUpload' | 'documentUpload') => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append(type, file);

      // Try local upload first (more reliable)
      let response = await fetch('/api/upload-local', {
        method: 'POST',
        body: formData,
      });

      // If local upload fails, try R2 upload
      if (!response.ok) {
        console.log('Local upload failed, trying R2 upload...');
        response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      console.log('Upload successful:', result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadError(errorMessage);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadFile,
    isUploading,
    uploadError,
  };
}
