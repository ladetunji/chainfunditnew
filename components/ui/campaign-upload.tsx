import React, { useState } from 'react';
import { Upload } from './upload';
import { Button } from './button';
import { Image as ImageIcon, Paperclip, X } from 'lucide-react';
import Image from 'next/image';

interface CampaignUploadProps {
  type: 'imageUpload' | 'documentUpload';
  onUpload: (url: string) => void;
  onRemove?: (index: number) => void;
  uploadedUrls: string[];
  maxFiles?: number;
  accept?: string;
  className?: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

export function CampaignUpload({
  type,
  onUpload,
  onRemove,
  uploadedUrls,
  maxFiles = 5,
  accept,
  className,
  label,
  description,
  icon
}: CampaignUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (url: string) => {
    if (uploadedUrls.length >= maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }
    onUpload(url);
  };

  const handleRemove = (index: number) => {
    if (onRemove) {
      onRemove(index);
    }
  };

  return (
    <div className={className}>
      <div className="flex flex-col gap-1">
        <p className="font-medium text-2xl text-[#104901] flex gap-2 items-end">
          {label}
          <span className="font-normal text-base text-[#5F8555]">
            {description}
          </span>
        </p>
        
        <div className="grid md:grid-cols-3 grid-cols-1 gap-4 my-2">
          {uploadedUrls.length < maxFiles && (
            <Upload
              type={type}
              accept={accept}
              onUpload={handleUpload}
              className="col-span-1"
            >
              <div className="bg-[#E5ECDE] flex gap-3 items-center px-8 py-4 rounded-2xl text-xl text-[#5F8555] cursor-pointer">
                {icon}
                {type === 'imageUpload' ? 'Choose image' : 'Choose file'}
              </div>
            </Upload>
          )}

          {/* Show uploaded files */}
          {uploadedUrls.map((url, index) => (
            <div
              key={index}
              className="relative bg-[#E5ECDE] rounded-2xl overflow-hidden flex items-center justify-center"
            >
              {type === 'imageUpload' ? (
                <Image
                  src={url}
                  alt={`uploaded-${index}`}
                  width={200}
                  height={120}
                  className="object-cover w-full h-[120px]"
                />
              ) : (
                <div className="px-4 py-3 flex items-center gap-2 text-[#5F8555] text-sm">
                  <ImageIcon size={20} />
                  <span>Document {index + 1}</span>
                </div>
              )}
              
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-2 right-2 bg-red-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center"
              >
                <X size={12} />
              </button>
            </div>
          ))}

          {/* Show empty slots */}
          {uploadedUrls.length === 0 && (
            <>
              {[...Array(maxFiles)].map((_, index) => (
                <section
                  key={index}
                  className="bg-[#E5ECDE] flex gap-3 items-center px-8 py-4 rounded-2xl text-xl text-[#5F8555]"
                >
                  {icon}
                  {type === 'imageUpload' ? 'Choose image' : 'Choose file'}
                </section>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
