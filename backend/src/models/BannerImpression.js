var mongoose = require('mongoose');

var BannerImpressionSchema = new mongoose.Schema({
    // Banner reference
    bannerId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Banner',
        required: true
    },

    // User information
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    phone: String,

    // Session tracking
    sessionId: String,
    deviceId: String,

    // Impression details
    impressedAt: {
        type: Date,
        default: Date.now
    },

    // Location where displayed
    displayLocation: String,

    // Device info
    platform: String, // 'ios', 'android', 'web'

    // Network info
    ipAddress: String,

    // User interaction
    viewDuration: Number, // Milliseconds banner was visible
    wasClicked: {
        type: Boolean,
        default: false
    },

    // For frequency capping
    userImpressionCount: Number // This is the Nth time this user saw this banner
});

// Indexes
BannerImpressionSchema.index({ bannerId: 1, impressedAt: -1 });
BannerImpressionSchema.index({ userId: 1, bannerId: 1, impressedAt: -1 });
BannerImpressionSchema.index({ impressedAt: -1 });
BannerImpressionSchema.index({ sessionId: 1 });

// TTL index - auto-delete impressions older than 90 days to save space
BannerImpressionSchema.index({ impressedAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

// Export the schema
module.exports = BannerImpressionSchema;
