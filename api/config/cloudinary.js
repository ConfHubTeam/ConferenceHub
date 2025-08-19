const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configure Cloudinary with environment variables
// This approach tries the URL first (if available) and falls back to individual credentials
try {
  if (process.env.CLOUDINARY_URL) {
    // This will use the CLOUDINARY_URL environment variable automatically
    cloudinary.config();
  } else {
    // Fall back to individual credentials
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
  }
} catch (error) {
  console.error('Error configuring Cloudinary:', error.message);
}

module.exports = cloudinary;