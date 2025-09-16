/**
 * Maps campaign categories to appropriate emojis for fallback cover images
 */

export const CAMPAIGN_CATEGORY_EMOJIS: Record<string, string> = {
  // Business & Professional
  'Business': '💼',
  
  // Charity & Giving
  'Charity': '🎁',
  
  // Community & Social
  'Community': '🤝',
  
  // Creative & Arts
  'Creative': '🎨',
  
  // Education & Learning
  'Education': '📚',
  
  // Emergency & Urgent
  'Emergency': '🚨',
  
  // Religion & Faith
  'Religion': '⛪',
  
  // Family & Personal
  'Family': '👨‍👩‍👧‍👦',
  
  // Medical & Health
  'Medical': '🏥',
  
  // Memorial & Tribute
  'Memorial': '🕊️',
  
  // Pets & Animals
  'Pets': '🐾',
  
  // Sports & Fitness
  'Sports': '⚽',
  
  // Welfare & Social Services
  'Welfare': '🚑',
  
  // Default fallback
  'Uncategorized': '📋',
};

/**
 * Gets the appropriate emoji for a campaign category
 * @param category - The campaign category/reason
 * @returns The emoji string for the category
 */
export function getCampaignEmoji(category: string): string {
  return CAMPAIGN_CATEGORY_EMOJIS[category] || CAMPAIGN_CATEGORY_EMOJIS['Uncategorized'];
}

/**
 * Gets a fallback cover image URL with emoji for campaigns without images
 * @param category - The campaign category/reason
 * @param title - The campaign title (for additional context)
 * @returns A data URL with emoji background
 */
export function getEmojiFallbackImage(category: string, title?: string): string {
  const emoji = getCampaignEmoji(category);
  
  // Create a data URL with emoji as background
  // Using a large emoji with gradient background
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    // Fallback to simple emoji if canvas is not available
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#E5ECDE;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#104901;stop-opacity:0.1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)"/>
        <text x="50%" y="50%" font-size="120" text-anchor="middle" dy="0.3em">${emoji}</text>
      </svg>
    `)}`;
  }
  
  // Set canvas size
  canvas.width = 400;
  canvas.height = 300;
  
  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#E5ECDE');
  gradient.addColorStop(1, '#104901');
  
  // Fill background
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add emoji
  ctx.font = '120px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#104901';
  ctx.fillText(emoji, canvas.width / 2, canvas.height / 2);
  
  return canvas.toDataURL('image/png');
}

/**
 * Checks if a campaign needs an emoji fallback
 * @param coverImageUrl - The campaign's cover image URL
 * @returns true if fallback is needed
 */
export function needsEmojiFallback(coverImageUrl?: string): boolean {
  if (!coverImageUrl) return true;
  
  // Check if it's a placeholder image
  const placeholderImages = [
    '/images/card-img1.png',
    '/images/placeholder.png',
    '/images/default-campaign.png'
  ];
  
  return placeholderImages.some(placeholder => coverImageUrl.includes(placeholder));
}
