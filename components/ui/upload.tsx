import React, { useRef } from 'react';
import { Button } from './button';
import { useFileUpload } from '@/hooks/use-upload';

interface UploadProps {
  onUpload: (url: string) => void;
  type: 'imageUpload' | 'documentUpload';
  accept?: string;
  maxSize?: number;
  className?: string;
  children?: React.ReactNode;
}

export function Upload({ 
  onUpload, 
  type, 
  accept, 
  maxSize = 5 * 1024 * 1024, // 5MB default
  className,
  children 
}: UploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading, uploadError } = useFileUpload();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSize) {
      alert(`File size must be less than ${maxSize / 1024 / 1024}MB`);
      return;
    }

    try {
      const result = await uploadFile(file, type);
      if (result && result.url) {
        onUpload(result.url);
      }
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <Button 
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? 'Uploading...' : (children || 'Upload File')}
      </Button>
      {uploadError && <p className="text-red-500 text-sm mt-1">{uploadError}</p>}
    </div>
  );
}
