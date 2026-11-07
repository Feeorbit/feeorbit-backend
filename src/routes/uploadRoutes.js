const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

// Configure Multer for memory storage (buffers passed to Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WEBP, SVG, GIF) are allowed.'), false);
    }
  },
});

/**
 * @route   POST /api/upload
 * @desc    Upload an image (file or base64 data) to Cloudinary
 * @access  Public or Protected
 */
const fs = require('fs');
const path = require('path');

router.post('/', upload.single('image'), async (req, res) => {
  try {
    const folder = req.body.folder || 'feeorbit/general';

    // 1. Check if uploaded via multipart/form-data (req.file)
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer, {
          folder,
          resource_type: 'image',
        });
        return res.status(200).json({
          success: true,
          message: 'Image uploaded successfully to Cloudinary',
          url: result.secure_url,
          publicId: result.public_id,
        });
      } catch (cloudErr) {
        console.warn('Cloudinary upload warning, saving to local static storage:', cloudErr.message);
        const ext = (req.file.mimetype.split('/')[1] || 'png').replace('svg+xml', 'svg');
        const filename = `img_${Date.now()}_${Math.random().toString(36).slice(-4)}.${ext}`;
        const uploadDir = path.join(__dirname, '../../public/uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        fs.writeFileSync(path.join(uploadDir, filename), req.file.buffer);

        const localUrl = `http://localhost:5000/uploads/${filename}`;
        return res.status(200).json({
          success: true,
          message: 'Image uploaded successfully',
          url: localUrl,
          fallback: true,
        });
      }
    }
    // 2. Check if uploaded via JSON base64 string or remote URL (req.body.image)
    else if (req.body && req.body.image) {
      try {
        const result = await uploadToCloudinary(req.body.image, {
          folder,
          resource_type: 'image',
        });
        return res.status(200).json({
          success: true,
          message: 'Image uploaded successfully to Cloudinary',
          url: result.secure_url,
          publicId: result.public_id,
        });
      } catch (cloudErr) {
        return res.status(200).json({
          success: true,
          message: 'Base64 image preserved',
          url: req.body.image,
          fallback: true,
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'No image file or base64 image data provided.',
      });
    }
  } catch (error) {
    console.error('Upload Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Image upload failed.',
    });
  }
});

/**
 * @route   DELETE /api/upload
 * @desc    Delete an asset from Cloudinary by publicId
 * @access  Protected
 */
router.delete('/', async (req, res) => {
  try {
    const { publicId } = req.body;
    if (!publicId) {
      return res.status(400).json({ success: false, message: 'publicId is required.' });
    }

    const result = await deleteFromCloudinary(publicId);
    return res.status(200).json({
      success: true,
      message: 'Asset removed from Cloudinary',
      result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete asset from Cloudinary',
    });
  }
});

module.exports = router;
