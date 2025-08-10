"use client";

import React from "react";
import Image from "next/image";
import { User } from "lucide-react";

interface CampaignCreatorAvatarProps {
  creatorName: string;
  creatorAvatar?: string;
  size?: number;
  className?: string;
  fallbackSrc?: string;
}

const CampaignCreatorAvatar: React.FC<CampaignCreatorAvatarProps> = ({
  creatorName,
  creatorAvatar,
  size = 32,
  className = "",
  fallbackSrc = "/images/user.png",
}) => {
  // If creator has an avatar, display it
  if (creatorAvatar) {
    return (
      <Image
        src={creatorAvatar}
        alt={creatorName}
        width={size}
        height={size}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  // Fallback to default avatar image
  return (
    <Image
      src={fallbackSrc}
      alt={creatorName}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  );
};

export default CampaignCreatorAvatar; 