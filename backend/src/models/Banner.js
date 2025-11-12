var mongoose = require('mongoose');

var BannerSchema = new mongoose.Schema({
    // Banner identification
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: String,

    // Content - can have text, image, or both
    contentType: {
        type: String,
        enum: ['text', 'image', 'combo'],
        required: true
    },
    richTextContent: String, // HTML rich text content
    imageBase64: String, // Base64 encoded image (legacy)
    imageUrl: String, // Or image URL (legacy)

    // Cloudinary image integration (advanced)
    cloudinaryImage: {
        publicId: String, // Cloudinary public ID
        url: String, // Cloudinary URL
        secureUrl: String, // HTTPS URL
        thumbnailUrl: String, // Optimized thumbnail
        format: String, // Image format (jpg, png, etc.)
        width: Number, // Original width
        height: Number, // Original height
        uploadedAt: Date
    },

    // Banner size
    size: {
        type: String,
        enum: ['small', 'medium', 'large', 'custom'],
        default: 'medium'
    },
    customWidth: Number, // pixels
    customHeight: Number, // pixels

    // Click behavior
    clickBehavior: {
        type: String,
        enum: ['external', 'internal'],
        required: true
    },
    externalUrl: String, // External link
    internalRoute: String, // Internal app route like '/appointments', '/home'

    // Scheduling (Advanced)
    schedule: {
        startDate: {
            type: Date,
            required: true
        },
        endDate: {
            type: Date,
            required: true
        },
        startTime: String, // HH:MM format like "09:00"
        endTime: String, // HH:MM format like "18:00"

        // Timezone support (IANA timezone names like 'America/New_York')
        timezone: {
            type: String,
            default: 'UTC'
        },

        // Frequency
        frequency: {
            type: String,
            enum: ['always', 'daily', 'weekly', 'monthly', 'yearly', 'specific_days'],
            default: 'always'
        },
        daysOfWeek: [Number], // 0=Sunday, 1=Monday, etc. (for weekly/specific_days)
        daysOfMonth: [Number], // 1-31 (for monthly recurring)
        monthsOfYear: [Number], // 1-12 (for yearly recurring)

        // Recurring patterns
        recurringPattern: {
            enabled: {
                type: Boolean,
                default: false
            },
            type: {
                type: String,
                enum: ['daily', 'weekly', 'monthly', 'yearly'],
                default: 'daily'
            },
            interval: {
                type: Number,
                default: 1 // Every N days/weeks/months/years
            },
            endType: {
                type: String,
                enum: ['never', 'after_occurrences', 'on_date'],
                default: 'never'
            },
            occurrences: Number, // Number of occurrences before stopping
            endDate: Date // End date for recurring pattern
        },

        // Blackout periods (when banner should NOT be shown)
        blackoutDates: [{
            startDate: Date,
            endDate: Date,
            reason: String // Optional reason for blackout
        }],

        blackoutTimes: [{
            startTime: String, // HH:MM format
            endTime: String, // HH:MM format
            daysOfWeek: [Number] // Which days this blackout applies to
        }],

        // Display frequency limits
        maxImpressionsPerUser: Number, // Max times to show to same user
        maxClicksPerUser: Number // Max clicks per user before hiding
    },

    // Display settings
    displayLocation: {
        type: String,
        enum: ['home', 'appointments', 'emr', 'all'],
        default: 'all'
    },
    priority: {
        type: Number,
        default: 0 // Higher number = higher priority
    },

    // Status
    isActive: {
        type: Boolean,
        default: true
    },

    // Statistics (aggregate counts)
    totalImpressions: {
        type: Number,
        default: 0
    },
    totalClicks: {
        type: Number,
        default: 0
    },

    // Metadata
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes for efficient queries
BannerSchema.index({ isActive: 1, 'schedule.startDate': 1, 'schedule.endDate': 1 });
BannerSchema.index({ displayLocation: 1, priority: -1 });
BannerSchema.index({ createdAt: -1 });

// Update updatedAt on save
BannerSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Export the schema
module.exports = BannerSchema;
