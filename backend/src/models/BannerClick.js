var mongoose = require('mongoose');

var BannerClickSchema = new mongoose.Schema({
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
    userName: String,
    phone: String,

    // Session tracking
    sessionId: String,
    deviceId: String,

    // Click details
    clickedAt: {
        type: Date,
        default: Date.now
    },

    // Location where the banner was displayed
    displayLocation: String, // 'home', 'appointments', etc.

    // User agent and device info
    userAgent: String,
    deviceType: String, // 'mobile', 'tablet', 'desktop'
    platform: String, // 'ios', 'android', 'web'

    // Network info
    ipAddress: String,

    // Click behavior
    clickBehavior: String, // 'external' or 'internal'
    targetUrl: String, // Where they were directed

    // Interaction metadata
    timeOnPage: Number, // Milliseconds user spent on page before click
    scrollPosition: Number, // Scroll position when clicked (%)

    // Banner state at time of click
    bannerImpressionNumber: Number // Which impression led to this click (1st, 2nd, 3rd time seeing it)
});

// Indexes for analytics and reporting
BannerClickSchema.index({ bannerId: 1, clickedAt: -1 });
BannerClickSchema.index({ userId: 1, clickedAt: -1 });
BannerClickSchema.index({ clickedAt: -1 });
BannerClickSchema.index({ sessionId: 1 });
BannerClickSchema.index({ bannerId: 1, userId: 1 });

// Export the schema
module.exports = BannerClickSchema;
