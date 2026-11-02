import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a local file to Cloudinary and returns its secure URL.
 * @param {string} localFilePath - Absolute path to the local temp file
 * @param {string} originalName - Original filename
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<string>} Cloudinary secure_url
 */
export async function uploadFileToStorage(localFilePath, originalName, mimeType) {
  try {
    const result = await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'video',
      folder: 'lectures',
      use_filename: true,
      unique_filename: true,
    });

    console.log(`File uploaded to Cloudinary: ${result.secure_url}`);
    return result.secure_url;
  } catch (uploadError) {
    throw new Error(`Cloudinary upload failed: ${uploadError.message}`);
  } finally {
    // Always delete the local temp file
    try {
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
    } catch (cleanupErr) {
      console.warn('Could not delete local temp file:', localFilePath, cleanupErr.message);
    }
  }
}
