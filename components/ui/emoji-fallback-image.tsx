import React from 'react';
import { getCampaignEmoji } from '@/lib/utils/campaign-emojis';

interface EmojiFallbackImageProps {
  category: string;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
  width?: number;
  height?: number;
  fill?: boolean;
}

export function EmojiFallbackImage({ 
  category, 
  title, 
  className = '', 
  style = {},
  width = 400,
  height = 300,
  fill = false
}: EmojiFallbackImageProps) {
  const emoji = getCampaignEmoji(category);
  
  const containerStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #E5ECDE 0%, #104901 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    ...style,
  };

  const emojiStyle: React.CSSProperties = {
    fontSize: fill ? '8rem' : '6rem',
    color: '#104901',
    textShadow: '0 2px 4px rgba(0,0,0,0.1)',
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
  };

  if (fill) {
    return (
      <div className={`absolute inset-0 ${className}`} style={containerStyle}>
        <span style={emojiStyle} aria-label={`${category} campaign`}>
          {emoji}
        </span>
      </div>
    );
  }

  return (
    <div 
      className={className}
      style={{
        ...containerStyle,
        width: width,
        height: height,
      }}
    >
      <span style={emojiStyle} aria-label={`${category} campaign`}>
        {emoji}
      </span>
    </div>
  );
}
