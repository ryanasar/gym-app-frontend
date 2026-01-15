import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Image manipulation options for different contexts
 */
export const IMAGE_UPLOAD_PRESETS = {
  POST: {
    maxWidth: 1080,
    compress: 0.7,
  },
  PROFILE: {
    maxWidth: 512,
    compress: 0.75,
  },
  THUMBNAIL: {
    maxWidth: 400,
    compress: 0.6,
  },
} as const;

export interface PreparedImage {
  uri: string;
  width: number;
  height: number;
}

/**
 * Prepares an image for upload by resizing and compressing it
 * @param uri - Local file URI from ImagePicker
 * @param maxWidth - Maximum width in pixels (default: 1080)
 * @param compress - Compression quality 0-1 (default: 0.7)
 * @returns Manipulated image result with new URI, width, and height
 */
export const prepareImageForUpload = async (
  uri: string,
  maxWidth: number = 1080,
  compress: number = 0.7
): Promise<PreparedImage> => {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: maxWidth } }],
      {
        compress,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    return {
      uri: result.uri,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error('Error preparing image for upload:', error);
    // Return original URI if manipulation fails
    return {
      uri,
      width: 0,
      height: 0,
    };
  }
};

/**
 * Prepares a post image for upload (1080px max, 70% quality)
 */
export const preparePostImage = async (uri: string): Promise<PreparedImage> => {
  return prepareImageForUpload(
    uri,
    IMAGE_UPLOAD_PRESETS.POST.maxWidth,
    IMAGE_UPLOAD_PRESETS.POST.compress
  );
};

/**
 * Prepares a profile image for upload (512px max, 75% quality)
 */
export const prepareProfileImage = async (uri: string): Promise<PreparedImage> => {
  return prepareImageForUpload(
    uri,
    IMAGE_UPLOAD_PRESETS.PROFILE.maxWidth,
    IMAGE_UPLOAD_PRESETS.PROFILE.compress
  );
};

/**
 * Prepares a thumbnail image for upload (400px max, 60% quality)
 */
export const prepareThumbnailImage = async (uri: string): Promise<PreparedImage> => {
  return prepareImageForUpload(
    uri,
    IMAGE_UPLOAD_PRESETS.THUMBNAIL.maxWidth,
    IMAGE_UPLOAD_PRESETS.THUMBNAIL.compress
  );
};
