import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
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

/**
 * Generate thumbnail from video and upload to Cloudinary
 * @param {string} videoPath - Path to video file (URL or local path)
 * @returns {Promise<string|null>} Cloudinary thumbnail URL or null on failure
 */
export async function generateAndUploadThumbnail(videoPath) {
  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const thumbnailPath = path.join(tempDir, `thumbnail-${Date.now()}.jpg`);

  try {
    console.log('Generating thumbnail from video...');
    
    // Extract thumbnail at 1 second using ffmpeg
    await new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: ['00:00:01'],
          filename: path.basename(thumbnailPath),
          folder: tempDir,
          size: '1280x720'
        })
        .on('end', () => {
          console.log('Thumbnail generated successfully');
          resolve();
        })
        .on('error', (err) => {
          console.error('FFmpeg thumbnail generation error:', err);
          reject(err);
        });
    });

    // Upload thumbnail to Cloudinary
    console.log('Uploading thumbnail to Cloudinary...');
    const result = await cloudinary.uploader.upload(thumbnailPath, {
      resource_type: 'image',
      folder: 'thumbnails',
      use_filename: false,
      unique_filename: true,
    });

    console.log(`Thumbnail uploaded to Cloudinary: ${result.secure_url}`);
    return result.secure_url;

  } catch (error) {
    console.error('Thumbnail generation/upload failed:', error.message);
    return null; // Return null on failure, don't block video processing
  } finally {
    // Cleanup thumbnail file
    try {
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
      }
    } catch (cleanupErr) {
      console.warn('Could not delete thumbnail temp file:', thumbnailPath, cleanupErr.message);
    }
  }
}
