import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import winston from 'winston';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dummy_cloud',
  api_key: process.env.CLOUDINARY_API_KEY || 'dummy_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'dummy_secret',
});

/**
 * Upload a file buffer to Cloudinary using upload_stream
 * @param {Buffer} fileBuffer 
 * @param {string} folder 
 * @returns {Promise<{url: string, public_id: string}>}
 */
export const uploadToCloudinary = (fileBuffer, folder = 'sanchara_setu') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) {
          winston.error(`Cloudinary upload error: ${error.message}`);
          return reject(error);
        }
        resolve({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );
    Readable.from(fileBuffer).pipe(uploadStream);
  });
};

/**
 * Delete an asset from Cloudinary by its public ID
 * @param {string} publicId 
 * @returns {Promise<any>}
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    winston.error(`Cloudinary delete error: ${error.message}`);
    throw error;
  }
};

export default cloudinary;
