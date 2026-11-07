const cloudinary = require('cloudinary').v2;

// Configure Cloudinary using individual keys or CLOUDINARY_URL
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL,
    secure: true,
  });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/**
 * Upload a file buffer or base64 data to Cloudinary
 * @param {Buffer|string} fileSource - File Buffer or Base64 / Remote URL string
 * @param {Object} options - Cloudinary upload options (folder, transformation, etc.)
 * @returns {Promise<Object>} Cloudinary upload response
 */
const uploadToCloudinary = (fileSource, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: options.folder || 'feeorbit/uploads',
      resource_type: options.resource_type || 'auto',
      ...options,
    };

    // If fileSource is a Buffer (from Multer memoryStorage)
    if (Buffer.isBuffer(fileSource)) {
      const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
      stream.end(fileSource);
    } else {
      // If fileSource is base64 data URI or remote image URL
      cloudinary.uploader.upload(fileSource, uploadOptions, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    }
  });
};

/**
 * Delete an asset from Cloudinary
 * @param {string} publicId - Cloudinary asset public ID
 * @returns {Promise<Object>} Cloudinary destroy response
 */
const deleteFromCloudinary = (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
};
