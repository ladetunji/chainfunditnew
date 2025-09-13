import React, { useRef, useState } from 'react';
import { useFileUpload } from '@/hooks/use-upload';
import { Plus, Image as LuImage } from 'lucide-react';

interface UploadProps {
  onUpload: (url: string) => void;
  type: 'imageUpload' | 'documentUpload';
  accept?: string;
  maxSize?: number;
  className?: string;
  children?: React.ReactNode;
  previewUrl?: string;
}

export function Upload({ 
  onUpload, 
  type, 
  accept = "image/*", 
  maxSize = 5 * 1024 * 1024, // 5MB default
  className,
  children,
  previewUrl
}: UploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading, uploadError } = useFileUpload();
  const [localPreview, setLocalPreview] = useState<string>('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSize) {
      alert(`File size must be less than ${maxSize / 1024 / 1024}MB`);
      return;
    }

    // Create local preview immediately
    const localUrl = URL.createObjectURL(file);
    setLocalPreview(localUrl);

    try {
      const result = await uploadFile(file, type);
      if (result && result.url) {
        onUpload(result.url);
        // Clear local preview once upload is complete
        setLocalPreview('');
      }
    } catch (error) {
      console.error('Upload error:', error);
      // Clear local preview on error
      setLocalPreview('');
    }
  };

  const currentPreview = localPreview || previewUrl;

  return (
    <div className={className}>
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFileChange}
        />
        <label
          htmlFor="upload-input"
          className="w-[200px] md:w-[360px] h-[200px] md:h-[360px] flex items-center justify-center cursor-pointer bg-center bg-cove transition-colors"
          style={{
            backgroundImage: currentPreview
              ? `url(${currentPreview})`
              : `url('/images/image.png')`,
          }}
          title="Upload campaign image"
          onClick={() => fileInputRef.current?.click()}
        >
        </label>
        
        {/* Plus button positioned to match original design */}
        <button
          type="button"
          className="w-8 md:w-[56px] h-8 md:h-[56px] bg-[#104901] flex items-center justify-center text-white absolute right-[118px] md:right-[160px] 2xl:right-[200px] bottom-6 md:bottom-11"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Plus className="md:text-4xl text-lg" size={36} />
        </button>
      </div>
      
      {isUploading && (
        <div className="text-center mt-2">
          <p className="text-sm text-gray-600">Uploading...</p>
        </div>
      )}
      
      {uploadError && (
        <p className="text-red-500 text-sm mt-2 text-center">{uploadError}</p>
      )}
      
      {children}
    </div>
  );
}
