import React, { useRef, useState } from 'react';
import { useFileUpload } from '@/hooks/use-upload';
import { Plus, Image as LuImage } from 'lucide-react';
import { toast } from 'sonner';

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
  maxSize = 5 * 1024 * 1024,
  className,
  children,
  previewUrl
}: UploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading, uploadError } = useFileUpload();
  uploadError && toast.error(uploadError);
  const [localPreview, setLocalPreview] = useState<string>('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
  
    if (file.size > maxSize) {
      toast.error(`File size must be less than ${maxSize / 1024 / 1024}MB`);
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setLocalPreview(localUrl);

    try {
      const result = await uploadFile(file, type);
      if (result && result.url) {
        onUpload(result.url);
      } else {
        toast.error('Upload result is invalid');
      }
    } catch (error) {
      toast.error('Upload error occurred');
      setLocalPreview('');
    }
  };

  const currentPreview = localPreview || previewUrl;

  const handleClick = () => {
    fileInputRef.current?.click();
  };
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
          className="w-[200px] md:w-[360px] h-[200px] md:h-[360px] flex items-center justify-center cursor-pointer bg-center bg-cover transition-colors"
          style={{
            backgroundImage: currentPreview
              ? `url(${currentPreview})`
              : `url('/images/image.png')`,
          }}
          title="Upload campaign image"
          onClick={handleClick}
        >
        </label>
        
        <button
          type="button"
          className="w-8 md:w-[56px] h-8 md:h-[56px] bg-[#104901] flex items-center justify-center text-white absolute right-[118px] md:right-[200px] 2xl:right-[200px] bottom-6 md:bottom-11"
          onClick={handleClick}
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
      {children}
    </div>
  );
}
