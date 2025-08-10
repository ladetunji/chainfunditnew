"use client";

import React from "react";
import Image from "next/image";
import { User } from "lucide-react";
import { useUserProfile } from "@/hooks/use-user-profile";

interface UserAvatarProps {
  size?: number;
  className?: string;
  fallbackSrc?: string;
  showLoading?: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  size = 32,
  className = "",
  fallbackSrc = "/images/user.png",
  showLoading = false,
}) => {
  const { profile, loading } = useUserProfile();

  // Show loading state if requested and still loading
  if (showLoading && loading) {
    return (
      <div
        className={`animate-pulse bg-gray-200 rounded-full ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  // If user has an avatar, display it
  if (profile?.avatar) {
    return (
      <Image
        src={profile.avatar}
        alt={profile.fullName || "User"}
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
      alt="User"
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  );
};

export default UserAvatar; 