import { ArrowUp, ArrowUp01 } from 'lucide-react';
import React, { useRef, useState } from 'react'

type Props = {}

const CompleteProfile = (props: Props) => {
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className='font-source'>
      <form action="" className='flex gap-4 items-center'>
        <div className='relative'>
          <input
            type="file"
            id="profile-image-upload"
            accept="image/*"
            className="hidden"
            ref={inputRef}
            onChange={handleFileChange}
          />
          <label
            htmlFor="profile-image-upload"
            className="w-[50px] md:w-[100px] h-[50px] md:h-[100px] rounded-full flex items-center justify-center cursor-pointer bg-center bg-cover"
            style={{
              backgroundImage: preview
                ? `url(${preview})`
                : `url('/images/avatar.svg')`,
            }}
            title="Upload profile image"
          >
            {!preview && (
              <span className="sr-only">Upload profile image</span>
            )}
          </label>
            <section className='w-4 md:w-[33px] h-4 md:h-[33px] bg-[#104901] rounded-full flex items-center justify-center text-white absolute left-7 md:left-16 bottom-0 md:bottom-2'>
            <ArrowUp />
          </section>
        </div>
        <div className='flex flex-col gap-2'>
            <label htmlFor="Name" className='font-normal text-xl text-[#104901]'>Name</label>
          <input type="text" placeholder='firstname lastname' className='w-[250px] md:w-[370px] px-5 py-2.5 placeholder:font-normal placeholder:text-2xl placeholder:text-[#767676] border border-[#D9D9DC] rounded-lg outline-none' />
        </div>
      </form>
    </div>
  )
}

export default CompleteProfile