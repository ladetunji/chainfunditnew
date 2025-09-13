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

      // Try R2 upload first
      let response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      // If R2 fails, try local upload
      if (!response.ok) {
        response = await fetch('/api/upload-local', {
          method: 'POST',
          body: formData,
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
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
