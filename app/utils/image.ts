import { SUPABASE_URL } from '../../constants';

/**
 * Image size presets for different UI contexts (used for pre-upload resizing)
 */
export const IMAGE_SIZES = {
  THUMBNAIL: 200,
  AVATAR: 256,
  FEED: 400,
  FULLSCREEN: 1080,
} as const;

/**
 * Returns the image URL, handling both full URLs and storage paths.
 * Note: Supabase image transformation requires Pro plan.
 * Optimization is achieved through pre-upload compression and expo-image caching.
 *
 * @param urlOrPath - Full URL or storage path
 * @returns The image URL
 */
export const getImageUrl = (urlOrPath: string): string => {
  if (!urlOrPath) return '';

  // If it's already a full URL, return as-is
  if (urlOrPath.startsWith('http')) {
    return urlOrPath;
  }

  // If it's a storage path, construct the full URL
  return `${SUPABASE_URL}/storage/v1/object/public/images/${urlOrPath}`;
};

/**
 * Generates image URL for feed posts
 */
export const getFeedImageUrl = (urlOrPath: string): string => {
  return getImageUrl(urlOrPath);
};

/**
 * Generates image URL for avatars/profile pictures
 */
export const getAvatarImageUrl = (urlOrPath: string): string => {
  return getImageUrl(urlOrPath);
};

/**
 * Generates image URL for thumbnails
 */
export const getThumbnailImageUrl = (urlOrPath: string): string => {
  return getImageUrl(urlOrPath);
};

/**
 * Generates full-resolution image URL
 */
export const getFullscreenImageUrl = (urlOrPath: string): string => {
  return getImageUrl(urlOrPath);
};

/**
 * Adds cache busting parameter for updated images
 * @param url - The image URL
 * @param updatedAt - The timestamp when the image was last updated
 * @returns URL with cache busting parameter
 */
export const withCacheBusting = (url: string, updatedAt?: string | number | Date): string => {
  if (!url || !updatedAt) return url;

  const timestamp = updatedAt instanceof Date
    ? updatedAt.getTime()
    : typeof updatedAt === 'string'
      ? new Date(updatedAt).getTime()
      : updatedAt;

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${timestamp}`;
};
