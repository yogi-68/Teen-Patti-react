import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

/**
 * Upload avatar to Cloudinary
 * @param file - File buffer or base64 string
 * @param folder - Cloudinary folder to store the image
 * @returns Upload result with secure_url
 */
export async function uploadAvatar(file: string, folder: string = 'bot-avatars') {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder,
      resource_type: 'image',
      transformation: [
        { width: 200, height: 200, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' }
      ]
    });

    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Delete avatar from Cloudinary
 * @param publicId - Cloudinary public_id of the image
 */
export async function deleteAvatar(publicId: string) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return {
      success: result.result === 'ok',
      result: result.result,
    };
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    };
  }
}

/**
 * Generate random avatar URL from DiceBear API
 * @param seed - Unique seed for avatar generation
 * @param style - Avatar style (avataaars, bottts, lorelei, etc.)
 */
export function generateRandomAvatar(seed?: string, style: string = 'avataaars'): string {
  const avatarSeed = seed || Math.random().toString(36).substring(7);
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${avatarSeed}`;
}

/**
 * Get random avatar style
 */
export function getRandomAvatarStyle(): string {
  const styles = ['avataaars', 'bottts', 'lorelei', 'notionists', 'personas', 'pixel-art'];
  return styles[Math.floor(Math.random() * styles.length)];
}
