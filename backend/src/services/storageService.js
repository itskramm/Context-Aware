import { getStorage } from 'firebase-admin/storage';
import fs from 'fs';

/**
 * Uploads a local file to Firebase Storage and returns its public URL.
 * @param {string} localFilePath - Absolute path to the local temp file
 * @param {string} originalName - Original filename (used in the Storage path)
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<string>} Public download URL
 */
export async function uploadFileToStorage(localFilePath, originalName, mimeType) {
  let bucket;
  try {
    bucket = getStorage().bucket();
  } catch (err) {
    throw new Error(
      'Firebase Storage bucket not configured. Please create a Storage bucket in the Firebase console at https://console.firebase.google.com/project/contextaware-507ad/storage'
    );
  }

  // Verify the bucket exists / is accessible
  const [exists] = await bucket.exists().catch(() => [false]);
  if (!exists) {
    throw new Error(
      'Firebase Storage bucket not configured. Please create a Storage bucket in the Firebase console at https://console.firebase.google.com/project/contextaware-507ad/storage'
    );
  }

  const timestamp = Date.now();
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const destination = `lectures/${timestamp}-${safeName}`;

  try {
    await bucket.upload(localFilePath, {
      destination,
      metadata: { contentType: mimeType }
    });

    const file = bucket.file(destination);
    await file.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;
    return publicUrl;
  } finally {
    // Always clean up the local temp file
    try {
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
    } catch (cleanupErr) {
      console.warn('Could not delete local temp file:', localFilePath, cleanupErr.message);
    }
  }
}
