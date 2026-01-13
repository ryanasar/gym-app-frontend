import { decode } from 'base64-arraybuffer';
import { supabase } from '../../supabase';

/**
 * Upload an image to Supabase Storage
 * @param {string} uri - Local file URI from ImagePicker
 * @param {string} folder - Folder path within the bucket (e.g., 'posts')
 * @returns {Promise<{url: string, path: string}>} - Public URL and storage path
 */
export const uploadImage = async (uri, folder = 'posts') => {
  try {
    // Fetch the file and convert to blob (modern approach, no deprecated APIs)
    const response = await fetch(uri);
    const blob = await response.blob();

    // Convert blob to base64
    const reader = new FileReader();
    const base64Promise = new Promise((resolve, reject) => {
      reader.onloadend = () => {
        const base64String = reader.result.split(',')[1]; // Remove data:image/xxx;base64, prefix
        resolve(base64String);
      };
      reader.onerror = reject;
    });
    reader.readAsDataURL(blob);
    const base64 = await base64Promise;

    // Generate a unique filename
    const fileExt = uri.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Convert base64 to ArrayBuffer
    const arrayBuffer = decode(base64);

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from('images')
      .upload(filePath, arrayBuffer, {
        contentType: `image/${fileExt}`,
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return {
      url: publicUrl,
      path: filePath,
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * Delete an image from Supabase Storage
 * @param {string} path - Storage path of the file
 * @returns {Promise<void>}
 */
export const deleteImage = async (path) => {
  try {
    const { error } = await supabase.storage
      .from('images')
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

/**
 * Get public URL for an image
 * @param {string} path - Storage path of the file
 * @returns {string} - Public URL
 */
export const getImageUrl = (path) => {
  const { data: { publicUrl } } = supabase.storage
    .from('images')
    .getPublicUrl(path);

  return publicUrl;
};

export default function StorageApiPage() {
  return null;
}
