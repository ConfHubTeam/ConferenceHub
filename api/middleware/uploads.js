const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

/**
 * Multer configuration for handling file uploads in memory
 */
const photoStorage = multer.memoryStorage();
const photoUpload = multer({ 
  storage: photoStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
    files: 100 // Maximum 100 files per upload
  },
});

/**
 * Process and upload files to Cloudinary
 * @param {Object} req - Express request object with files from multer
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const uploadToCloudinary = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      // No files to process, continue to next middleware
      return next();
    }
    
    const uploadPromises = req.files.map(file => {
      return new Promise((resolve, reject) => {
        // Create upload stream to Cloudinary
        const uploadStream = cloudinary.uploader.upload_stream({
          folder: 'conferencehub',
        }, (error, result) => {
          if (error) return reject(error);
          resolve({ 
            url: result.secure_url, 
            publicId: result.public_id,
            originalname: file.originalname
          });
        });
        
        // Pipe the file buffer to the upload stream
        streamifier.createReadStream(file.buffer).pipe(uploadStream);
      });
    });
    
    // Wait for all uploads to complete
    req.uploadedFiles = await Promise.all(uploadPromises);
    next();
  } catch (error) {
    console.error('Error uploading files to Cloudinary:', error);
    res.status(500).json({ error: 'Failed to upload images' });
  }
};

/**
 * Middleware to upload photos to Cloudinary
 */
const photoMiddleware = {
  array: (fieldName, maxCount) => {
    return [
      photoUpload.array(fieldName, maxCount),
      uploadToCloudinary
    ];
  },
  single: (fieldName) => {
    return [
      photoUpload.single(fieldName),
      uploadToCloudinary
    ];
  }
};

module.exports = {
  photoMiddleware,
  photoUpload,
  uploadToCloudinary
};
