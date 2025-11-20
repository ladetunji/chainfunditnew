"use client";

import React from "react";
import Image from "next/image";
import { User } from "lucide-react";
import { useUserProfile } from "@/hooks/use-user-profile";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar"

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
      <Avatar>
        <AvatarImage src={profile.avatar} />
        <AvatarFallback>
          {profile?.fullName?.charAt(0)}
        </AvatarFallback>
      </Avatar>
    );
  }

  // Fallback to default avatar image
  return (
    <Avatar>
      <AvatarImage src={fallbackSrc} />
      <AvatarFallback>
        {fallbackSrc?.charAt(0)}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar; 