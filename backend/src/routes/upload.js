import express from 'express';
import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for memory storage (don't save to disk)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

/**
 * POST /api/upload/profile-photo
 * Upload profile photo to Cloudinary
 */
router.post('/profile-photo', authenticate, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user?.uid || req.user?.user_id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Upload to Cloudinary using buffer
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'context-aware/profile-photos',
          public_id: `profile-${userId}-${Date.now()}`,
          overwrite: true,
          resource_type: 'image',
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      uploadStream.end(req.file.buffer);
    });

    const result = await uploadPromise;

    res.json({
      photoURL: result.secure_url,
      public_id: result.public_id,
    });
  } catch (err) {
    console.error('Profile photo upload error:', err);
    res.status(500).json({
      error: 'Failed to upload profile photo',
      details: err.message,
    });
  }
});

export default router;
