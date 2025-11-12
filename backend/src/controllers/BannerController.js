var restful = require('node-restful');
const ResponseHandler = require('../utils/ResponseHandler');
const AppError = require('../utils/AppError');
const ErrorCodes = require('../utils/ErrorCodes');
const { requireAdmin } = require('../middleware/adminAuth');

module.exports = function (app, route) {

    var resource = restful.model('banners', app.models.banner);
    // Disable auto-generated CRUD routes - we'll create them manually with admin protection
    var rest = resource.methods([]);

    // Helper function to check if banner should be displayed based on schedule
    function isScheduleActive(banner) {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight
        const currentDay = now.getDay(); // 0=Sunday, 1=Monday, etc.

        // Check date range
        if (now < new Date(banner.schedule.startDate) || now > new Date(banner.schedule.endDate)) {
            return false;
        }

        // Check time range if specified
        if (banner.schedule.startTime && banner.schedule.endTime) {
            const [startHour, startMin] = banner.schedule.startTime.split(':').map(Number);
            const [endHour, endMin] = banner.schedule.endTime.split(':').map(Number);
            const startMinutes = startHour * 60 + startMin;
            const endMinutes = endHour * 60 + endMin;

            if (currentTime < startMinutes || currentTime > endMinutes) {
                return false;
            }
        }

        // Check frequency
        if (banner.schedule.frequency === 'weekly' || banner.schedule.frequency === 'specific_days') {
            if (!banner.schedule.daysOfWeek || !banner.schedule.daysOfWeek.includes(currentDay)) {
                return false;
            }
        }

        return true;
    }

    // Get banners for display (with scheduling and frequency logic)
    app.get(route + '/serve', async function (req, res, next) {
        try {
            const { location = 'all', userId, sessionId } = req.query;

            // Find active banners for the location
            const query = {
                isActive: true,
                $or: [
                    { displayLocation: location },
                    { displayLocation: 'all' }
                ]
            };

            const banners = await app.models.banner.find(query).sort({ priority: -1 });

            // Filter by schedule
            const activeBanners = banners.filter(banner => isScheduleActive(banner));

            if (activeBanners.length === 0) {
                return ResponseHandler.success(res, { banner: null });
            }

            // If userId provided, check frequency caps
            let eligibleBanners = activeBanners;
            if (userId) {
                eligibleBanners = [];

                for (const banner of activeBanners) {
                    // Check max impressions per user
                    if (banner.schedule.maxImpressionsPerUser) {
                        const impressionCount = await app.models.bannerImpression.countDocuments({
                            bannerId: banner._id,
                            userId: userId
                        });

                        if (impressionCount >= banner.schedule.maxImpressionsPerUser) {
                            continue; // Skip this banner
                        }
                    }

                    // Check max clicks per user
                    if (banner.schedule.maxClicksPerUser) {
                        const clickCount = await app.models.bannerClick.countDocuments({
                            bannerId: banner._id,
                            userId: userId
                        });

                        if (clickCount >= banner.schedule.maxClicksPerUser) {
                            continue; // Skip this banner
                        }
                    }

                    eligibleBanners.push(banner);
                }
            }

            if (eligibleBanners.length === 0) {
                return ResponseHandler.success(res, { banner: null });
            }

            // Return the highest priority eligible banner
            const selectedBanner = eligibleBanners[0];

            // Calculate user impression count for this banner
            let userImpressionCount = 0;
            if (userId) {
                userImpressionCount = await app.models.bannerImpression.countDocuments({
                    bannerId: selectedBanner._id,
                    userId: userId
                });
            }

            return ResponseHandler.success(res, {
                banner: {
                    id: selectedBanner._id.toString(),
                    title: selectedBanner.title,
                    contentType: selectedBanner.contentType,
                    richTextContent: selectedBanner.richTextContent,
                    imageBase64: selectedBanner.imageBase64,
                    imageUrl: selectedBanner.imageUrl,
                    videoUrl: selectedBanner.videoUrl,
                    videoType: selectedBanner.videoType,
                    videoThumbnail: selectedBanner.videoThumbnail,
                    gifUrl: selectedBanner.gifUrl,
                    gifBase64: selectedBanner.gifBase64,
                    size: selectedBanner.size,
                    customWidth: selectedBanner.customWidth,
                    customHeight: selectedBanner.customHeight,
                    clickBehavior: selectedBanner.clickBehavior,
                    externalUrl: selectedBanner.externalUrl,
                    internalRoute: selectedBanner.internalRoute,
                    priority: selectedBanner.priority,
                    userImpressionCount: userImpressionCount + 1
                }
            });

        } catch (error) {
            console.error('Banner serve error:', error);
            return ResponseHandler.error(res, new AppError(ErrorCodes.INTERNAL_SERVER_ERROR, error.message));
        }
    });

    // Track impression
    app.post(route + '/impression', async function (req, res, next) {
        try {
            const {
                bannerId,
                userId,
                phone,
                sessionId,
                deviceId,
                displayLocation,
                platform,
                userImpressionCount
            } = req.body;

            if (!bannerId) {
                return ResponseHandler.error(res, new AppError(ErrorCodes.INVALID_INPUT, 'bannerId is required'));
            }

            // Create impression record
            await app.models.bannerImpression.create({
                bannerId,
                userId: userId || (req.user ? req.user._id : null),
                phone: phone || (req.user ? req.user.phone : null),
                sessionId,
                deviceId,
                displayLocation,
                platform,
                ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                userImpressionCount
            });

            // Increment totalImpressions counter
            await app.models.banner.findByIdAndUpdate(bannerId, {
                $inc: { totalImpressions: 1 }
            });

            return ResponseHandler.success(res, { tracked: true });

        } catch (error) {
            console.error('Impression tracking error:', error);
            // Don't fail the request if tracking fails
            return ResponseHandler.success(res, { tracked: false });
        }
    });

    // Track click (meticulous tracking)
    app.post(route + '/click', async function (req, res, next) {
        try {
            const {
                bannerId,
                userId,
                userName,
                phone,
                sessionId,
                deviceId,
                displayLocation,
                userAgent,
                deviceType,
                platform,
                clickBehavior,
                targetUrl,
                timeOnPage,
                scrollPosition,
                bannerImpressionNumber
            } = req.body;

            if (!bannerId) {
                return ResponseHandler.error(res, new AppError(ErrorCodes.INVALID_INPUT, 'bannerId is required'));
            }

            // Create click record with all details
            await app.models.bannerClick.create({
                bannerId,
                userId: userId || (req.user ? req.user._id : null),
                userName: userName || (req.user ? req.user.firstName : ''),
                phone: phone || (req.user ? req.user.phone : null),
                sessionId,
                deviceId,
                displayLocation,
                userAgent: userAgent || req.headers['user-agent'],
                deviceType,
                platform,
                ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                clickBehavior,
                targetUrl,
                timeOnPage,
                scrollPosition,
                bannerImpressionNumber
            });

            // Increment totalClicks counter
            await app.models.banner.findByIdAndUpdate(bannerId, {
                $inc: { totalClicks: 1 }
            });

            // Mark the impression as clicked if we have sessionId
            if (sessionId) {
                await app.models.bannerImpression.updateMany(
                    {
                        bannerId,
                        sessionId,
                        wasClicked: false
                    },
                    {
                        $set: { wasClicked: true }
                    }
                );
            }

            return ResponseHandler.success(res, {
                tracked: true,
                message: 'Click tracked successfully'
            });

        } catch (error) {
            console.error('Click tracking error:', error);
            // Don't fail the request if tracking fails
            return ResponseHandler.success(res, { tracked: false });
        }
    });

    // Get banner statistics (ADMIN ONLY)
    app.get(route + '/:id/statistics', requireAdmin, async function (req, res, next) {
        try {
            const bannerId = req.params.id;

            // Get banner details
            const banner = await app.models.banner.findById(bannerId);
            if (!banner) {
                return ResponseHandler.error(res, new AppError(ErrorCodes.NOT_FOUND, 'Banner not found'));
            }

            // Get detailed click statistics
            const totalClicks = await app.models.bannerClick.countDocuments({ bannerId });
            const uniqueUsers = await app.models.bannerClick.distinct('userId', { bannerId });
            const totalImpressions = await app.models.bannerImpression.countDocuments({ bannerId });

            // Calculate CTR (Click Through Rate)
            const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0;

            // Get clicks by day (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const clicksByDay = await app.models.bannerClick.aggregate([
                {
                    $match: {
                        bannerId: banner._id,
                        clickedAt: { $gte: thirtyDaysAgo }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: "%Y-%m-%d", date: "$clickedAt" }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            // Get impressions by day
            const impressionsByDay = await app.models.bannerImpression.aggregate([
                {
                    $match: {
                        bannerId: banner._id,
                        impressedAt: { $gte: thirtyDaysAgo }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: "%Y-%m-%d", date: "$impressedAt" }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            // Get clicks by location
            const clicksByLocation = await app.models.bannerClick.aggregate([
                { $match: { bannerId: banner._id } },
                {
                    $group: {
                        _id: "$displayLocation",
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } }
            ]);

            // Get clicks by platform
            const clicksByPlatform = await app.models.bannerClick.aggregate([
                { $match: { bannerId: banner._id } },
                {
                    $group: {
                        _id: "$platform",
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } }
            ]);

            // Merge clicks and impressions by day for the dashboard
            const dailyStatsMap = new Map();

            // Add impressions
            impressionsByDay.forEach(item => {
                dailyStatsMap.set(item._id, {
                    _id: item._id,
                    impressions: item.count,
                    clicks: 0
                });
            });

            // Add clicks
            clicksByDay.forEach(item => {
                if (dailyStatsMap.has(item._id)) {
                    dailyStatsMap.get(item._id).clicks = item.count;
                } else {
                    dailyStatsMap.set(item._id, {
                        _id: item._id,
                        impressions: 0,
                        clicks: item.count
                    });
                }
            });

            const dailyStats = Array.from(dailyStatsMap.values()).sort((a, b) =>
                a._id.localeCompare(b._id)
            );

            return ResponseHandler.success(res, {
                totalImpressions: totalImpressions,
                totalClicks: totalClicks,
                uniqueUsers: uniqueUsers.length,
                ctr: parseFloat(ctr),
                dailyStats: dailyStats,
                clicksByLocation: clicksByLocation,
                clicksByPlatform: clicksByPlatform,
                banner: {
                    id: banner._id.toString(),
                    title: banner.title,
                    isActive: banner.isActive
                }
            });

        } catch (error) {
            console.error('Statistics error:', error);
            return ResponseHandler.error(res, new AppError(ErrorCodes.INTERNAL_SERVER_ERROR, error.message));
        }
    });

    // List all banners with basic stats (ADMIN ONLY)
    app.get(route + '/list', requireAdmin, async function (req, res, next) {
        try {
            const banners = await app.models.banner.find({}).sort({ createdAt: -1 });

            const bannersWithStats = banners.map(banner => ({
                id: banner._id.toString(),
                title: banner.title,
                description: banner.description,
                contentType: banner.contentType,
                richTextContent: banner.richTextContent,
                imageBase64: banner.imageBase64,
                imageUrl: banner.imageUrl,
                videoUrl: banner.videoUrl,
                videoType: banner.videoType,
                videoThumbnail: banner.videoThumbnail,
                gifUrl: banner.gifUrl,
                gifBase64: banner.gifBase64,
                size: banner.size,
                customWidth: banner.customWidth,
                customHeight: banner.customHeight,
                clickBehavior: banner.clickBehavior,
                externalUrl: banner.externalUrl,
                internalRoute: banner.internalRoute,
                isActive: banner.isActive,
                displayLocation: banner.displayLocation,
                priority: banner.priority,
                schedule: {
                    startDate: banner.schedule.startDate,
                    endDate: banner.schedule.endDate,
                    frequency: banner.schedule.frequency
                },
                totalImpressions: banner.totalImpressions,
                totalClicks: banner.totalClicks,
                clickThroughRate: banner.totalImpressions > 0
                    ? ((banner.totalClicks / banner.totalImpressions) * 100).toFixed(2) + '%'
                    : '0%',
                createdAt: banner.createdAt,
                updatedAt: banner.updatedAt
            }));

            return ResponseHandler.success(res, {
                banners: bannersWithStats,
                total: bannersWithStats.length
            });

        } catch (error) {
            console.error('List banners error:', error);
            return ResponseHandler.error(res, new AppError(ErrorCodes.INTERNAL_SERVER_ERROR, error.message));
        }
    });

    // Check for schedule conflicts (ADMIN ONLY)
    app.post(route + '/check-conflicts', requireAdmin, async function (req, res, next) {
        try {
            const { schedule, displayLocation, priority, excludeBannerId } = req.body;

            if (!schedule || !schedule.startDate || !schedule.endDate) {
                return ResponseHandler.error(res, new AppError(ErrorCodes.INVALID_INPUT, 'Schedule with start and end dates is required'));
            }

            // Build query to find potentially conflicting banners
            const query = {
                isActive: true,
                $or: [
                    { displayLocation: displayLocation },
                    { displayLocation: 'all' },
                    ...(displayLocation === 'all' ? [] : [{ displayLocation: { $exists: true } }])
                ],
                // Check for date range overlap
                $and: [
                    { 'schedule.startDate': { $lte: new Date(schedule.endDate) } },
                    { 'schedule.endDate': { $gte: new Date(schedule.startDate) } }
                ]
            };

            // Exclude the banner being edited
            if (excludeBannerId) {
                query._id = { $ne: excludeBannerId };
            }

            const conflictingBanners = await app.models.banner.find(query);

            // Filter for more specific conflicts (time-based, day-based)
            const conflicts = [];
            for (const banner of conflictingBanners) {
                const conflict = {
                    bannerId: banner._id,
                    title: banner.title,
                    priority: banner.priority,
                    displayLocation: banner.displayLocation,
                    schedule: banner.schedule,
                    conflictType: []
                };

                // Check if same priority (potential conflict)
                if (banner.priority === priority) {
                    conflict.conflictType.push('same_priority');
                }

                // Check if higher priority (will override)
                if (banner.priority > priority) {
                    conflict.conflictType.push('higher_priority');
                }

                // Check time overlap if both have time restrictions
                if (schedule.startTime && schedule.endTime && banner.schedule.startTime && banner.schedule.endTime) {
                    const newStart = schedule.startTime;
                    const newEnd = schedule.endTime;
                    const existingStart = banner.schedule.startTime;
                    const existingEnd = banner.schedule.endTime;

                    if (!(newEnd <= existingStart || newStart >= existingEnd)) {
                        conflict.conflictType.push('time_overlap');
                    }
                }

                // Check day of week conflicts
                if (schedule.daysOfWeek && schedule.daysOfWeek.length > 0 &&
                    banner.schedule.daysOfWeek && banner.schedule.daysOfWeek.length > 0) {
                    const hasCommonDay = schedule.daysOfWeek.some(day =>
                        banner.schedule.daysOfWeek.includes(day)
                    );
                    if (hasCommonDay) {
                        conflict.conflictType.push('day_overlap');
                    }
                }

                if (conflict.conflictType.length > 0) {
                    conflicts.push(conflict);
                }
            }

            return ResponseHandler.success(res, {
                hasConflicts: conflicts.length > 0,
                conflicts: conflicts,
                message: conflicts.length > 0
                    ? `Found ${conflicts.length} potential scheduling conflict(s)`
                    : 'No scheduling conflicts detected'
            });

        } catch (error) {
            console.error('Conflict check error:', error);
            return ResponseHandler.error(res, new AppError(ErrorCodes.INTERNAL_SERVER_ERROR, error.message));
        }
    });

    // CRUD endpoints (ADMIN ONLY)
    // Get single banner by ID
    app.get(route + '/:id', requireAdmin, async function (req, res, next) {
        try {
            const banner = await app.models.banner.findById(req.params.id);
            if (!banner) {
                return ResponseHandler.error(res, new AppError(ErrorCodes.NOT_FOUND, 'Banner not found'));
            }
            return ResponseHandler.success(res, banner);
        } catch (error) {
            console.error('Get banner error:', error);
            return ResponseHandler.error(res, new AppError(ErrorCodes.INTERNAL_SERVER_ERROR, error.message));
        }
    });

    // Create new banner
    app.post(route, requireAdmin, async function (req, res, next) {
        try {
            const banner = await app.models.banner.create(req.body);
            return ResponseHandler.success(res, banner);
        } catch (error) {
            console.error('Create banner error:', error);
            return ResponseHandler.error(res, new AppError(ErrorCodes.INTERNAL_SERVER_ERROR, error.message));
        }
    });

    // Update banner
    app.put(route + '/:id', requireAdmin, async function (req, res, next) {
        try {
            const banner = await app.models.banner.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );
            if (!banner) {
                return ResponseHandler.error(res, new AppError(ErrorCodes.NOT_FOUND, 'Banner not found'));
            }
            return ResponseHandler.success(res, banner);
        } catch (error) {
            console.error('Update banner error:', error);
            return ResponseHandler.error(res, new AppError(ErrorCodes.INTERNAL_SERVER_ERROR, error.message));
        }
    });

    // Delete banner
    app.delete(route + '/:id', requireAdmin, async function (req, res, next) {
        try {
            const banner = await app.models.banner.findByIdAndDelete(req.params.id);
            if (!banner) {
                return ResponseHandler.error(res, new AppError(ErrorCodes.NOT_FOUND, 'Banner not found'));
            }
            return ResponseHandler.success(res, { message: 'Banner deleted successfully' });
        } catch (error) {
            console.error('Delete banner error:', error);
            return ResponseHandler.error(res, new AppError(ErrorCodes.INTERNAL_SERVER_ERROR, error.message));
        }
    });

    // Register any remaining restful endpoints (none in this case since we disabled auto-generation)
    rest.register(app, route);

    // Return middleware
    return function (req, res, next) {
        next();
    };
};
