import React from 'react';
import { Upload } from './upload';
import { ArrowUp } from 'lucide-react';

interface ProfileUploadProps {
  onUpload: (url: string) => void;
  currentImage?: string | null;
  className?: string;
}

export function ProfileUpload({ onUpload, currentImage, className }: ProfileUploadProps) {
  return (
    <div className={className}>
      <Upload
        type="imageUpload"
        accept="image/*"
        onUpload={onUpload}
        className="relative"
      >
        <div className="relative">
          <div
            className="w-[50px] md:w-[100px] h-[50px] md:h-[100px] rounded-full flex items-center justify-center cursor-pointer bg-center bg-cover border-2 border-white"
            style={{
              backgroundImage: currentImage
                ? `url(${currentImage})`
                : `url('/images/avatar.svg')`,
            }}
            title="Upload profile image"
          >
            {!currentImage && (
              <span className="sr-only">Upload profile image</span>
            )}
          </div>
          <section className="w-4 md:w-[33px] h-4 md:h-[33px] bg-[#104901] rounded-full flex items-center justify-center text-white absolute left-7 md:left-16 bottom-0 md:bottom-2">
            <ArrowUp />
          </section>
        </div>
      </Upload>
    </div>
  );
}
