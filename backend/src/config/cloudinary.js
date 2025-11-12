const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
// NOTE: Set these environment variables:
// CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your-cloud-name',
    api_key: process.env.CLOUDINARY_API_KEY || 'your-api-key',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'your-api-secret'
});

// Configure Multer storage for Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        // Determine folder based on file type
        const folder = 'banner-images';

        // Generate unique filename
        const filename = `banner-${Date.now()}`;

        // Set allowed formats
        const allowedFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

        return {
            folder: folder,
            public_id: filename,
            allowed_formats: allowedFormats,
            transformation: [
                {
                    width: 2000,
                    height: 2000,
                    crop: 'limit', // Limit to max dimensions, maintain aspect ratio
                    quality: 'auto:good', // Automatic quality optimization
                    fetch_format: 'auto' // Automatic format selection (WebP when supported)
                }
            ]
        };
    }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// Configure multer upload
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max file size
    },
    fileFilter: fileFilter
});

/**
 * Upload image to Cloudinary
 * @param {Object} file - Multer file object
 * @returns {Promise<Object>} Cloudinary upload result
 */
async function uploadImage(file) {
    try {
        const result = await cloudinary.uploader.upload(file.path, {
            folder: 'banner-images',
            transformation: [
                {
                    width: 2000,
                    height: 2000,
                    crop: 'limit',
                    quality: 'auto:good',
                    fetch_format: 'auto'
                }
            ]
        });

        return result;
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        throw error;
    }
}

/**
 * Delete image from Cloudinary
 * @param {String} publicId - Cloudinary public ID
 * @returns {Promise<Object>} Deletion result
 */
async function deleteImage(publicId) {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        throw error;
    }
}

/**
 * Generate optimized thumbnail URL
 * @param {String} publicId - Cloudinary public ID
 * @param {Number} width - Thumbnail width
 * @param {Number} height - Thumbnail height
 * @returns {String} Thumbnail URL
 */
function generateThumbnailUrl(publicId, width = 400, height = 300) {
    return cloudinary.url(publicId, {
        width: width,
        height: height,
        crop: 'fill',
        quality: 'auto:good',
        fetch_format: 'auto'
    });
}

/**
 * Generate responsive image URLs for different screen sizes
 * @param {String} publicId - Cloudinary public ID
 * @returns {Object} Object with URLs for different sizes
 */
function generateResponsiveUrls(publicId) {
    return {
        thumbnail: cloudinary.url(publicId, {
            width: 400,
            height: 300,
            crop: 'fill',
            quality: 'auto:good',
            fetch_format: 'auto'
        }),
        small: cloudinary.url(publicId, {
            width: 640,
            crop: 'scale',
            quality: 'auto:good',
            fetch_format: 'auto'
        }),
        medium: cloudinary.url(publicId, {
            width: 1024,
            crop: 'scale',
            quality: 'auto:good',
            fetch_format: 'auto'
        }),
        large: cloudinary.url(publicId, {
            width: 1920,
            crop: 'scale',
            quality: 'auto:good',
            fetch_format: 'auto'
        }),
        original: cloudinary.url(publicId, {
            quality: 'auto:best',
            fetch_format: 'auto'
        })
    };
}

module.exports = {
    cloudinary,
    upload,
    uploadImage,
    deleteImage,
    generateThumbnailUrl,
    generateResponsiveUrls
};
