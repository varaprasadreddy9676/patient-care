const ResponseHandler = require('../utils/ResponseHandler');
const AppError = require('../utils/AppError');
const ErrorCodes = require('../utils/ErrorCodes');

module.exports = function (app, route) {

    // Get aggregate app-wide analytics
    app.get(route + '/overview', async function (req, res, next) {
        try {
            const { startDate, endDate } = req.query;

            // Date range setup (default last 30 days)
            const end = endDate ? new Date(endDate) : new Date();
            const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

            // Set time boundaries
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);

            // 1. Total Users
            const totalUsers = await app.models.user.countDocuments();

            // 2. New Users in date range
            const newUsers = await app.models.user.countDocuments({
                createdAt: { $gte: start, $lte: end }
            });

            // 3. Active Sessions (unique users with audit trail events)
            const activeSessions = await app.models.auditTrail.distinct('userId', {
                dateTime: { $gte: start, $lte: end }
            });

            // 4. Total Events in date range
            const totalEvents = await app.models.auditTrail.countDocuments({
                dateTime: { $gte: start, $lte: end }
            });

            // 5. Total Appointments
            const totalAppointments = await app.models.appointment.countDocuments({
                createdAt: { $gte: start, $lte: end }
            });

            // 6. Banner Performance
            const bannerImpressions = await app.models.bannerImpression.countDocuments({
                impressedAt: { $gte: start, $lte: end }
            });
            const bannerClicks = await app.models.bannerClick.countDocuments({
                clickedAt: { $gte: start, $lte: end }
            });

            return ResponseHandler.success(res, {
                overview: {
                    totalUsers,
                    newUsers,
                    activeUsers: activeSessions.length,
                    totalEvents,
                    totalAppointments,
                    bannerImpressions,
                    bannerClicks
                },
                dateRange: {
                    start: start.toISOString(),
                    end: end.toISOString()
                }
            });

        } catch (error) {
            console.error('Analytics overview error:', error);
            return ResponseHandler.error(res, new AppError(ErrorCodes.INTERNAL_SERVER_ERROR, error.message));
        }
    });

    // Get user engagement analytics
    app.get(route + '/user-engagement', async function (req, res, next) {
        try {
            const { startDate, endDate } = req.query;

            const end = endDate ? new Date(endDate) : new Date();
            const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);

            // Daily user registrations
            const usersByDay = await app.models.user.aggregate([
                {
                    $match: {
                        createdAt: { $gte: start, $lte: end }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            // Daily active users (unique users with events)
            const activeUsersByDay = await app.models.auditTrail.aggregate([
                {
                    $match: {
                        dateTime: { $gte: start, $lte: end },
                        userId: { $ne: null }
                    }
                },
                {
                    $group: {
                        _id: {
                            date: { $dateToString: { format: "%Y-%m-%d", date: "$dateTime" } },
                            userId: "$userId"
                        }
                    }
                },
                {
                    $group: {
                        _id: "$_id.date",
                        uniqueUsers: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            // Events by category
            const eventsByCategory = await app.models.auditTrail.aggregate([
                {
                    $match: {
                        dateTime: { $gte: start, $lte: end }
                    }
                },
                {
                    $group: {
                        _id: "$category",
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } }
            ]);

            // Top events
            const topEvents = await app.models.auditTrail.aggregate([
                {
                    $match: {
                        dateTime: { $gte: start, $lte: end }
                    }
                },
                {
                    $group: {
                        _id: "$event",
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]);

            // Session statistics
            const sessionStats = await app.models.auditTrail.aggregate([
                {
                    $match: {
                        dateTime: { $gte: start, $lte: end },
                        sessionId: { $ne: null }
                    }
                },
                {
                    $group: {
                        _id: "$sessionId",
                        eventCount: { $sum: 1 },
                        duration: {
                            $subtract: [
                                { $max: "$dateTime" },
                                { $min: "$dateTime" }
                            ]
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalSessions: { $sum: 1 },
                        avgEventsPerSession: { $avg: "$eventCount" },
                        avgSessionDuration: { $avg: "$duration" }
                    }
                }
            ]);

            return ResponseHandler.success(res, {
                usersByDay,
                activeUsersByDay,
                eventsByCategory,
                topEvents,
                sessionStats: sessionStats[0] || {
                    totalSessions: 0,
                    avgEventsPerSession: 0,
                    avgSessionDuration: 0
                }
            });

        } catch (error) {
            console.error('User engagement analytics error:', error);
            return ResponseHandler.error(res, new AppError(ErrorCodes.INTERNAL_SERVER_ERROR, error.message));
        }
    });

    // Get appointment analytics
    app.get(route + '/appointments', async function (req, res, next) {
        try {
            const { startDate, endDate } = req.query;

            const end = endDate ? new Date(endDate) : new Date();
            const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);

            // Total appointments
            const totalAppointments = await app.models.appointment.countDocuments({
                createdAt: { $gte: start, $lte: end }
            });

            // Appointments by status
            const appointmentsByStatus = await app.models.appointment.aggregate([
                {
                    $match: {
                        createdAt: { $gte: start, $lte: end }
                    }
                },
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } }
            ]);

            // Appointments by day
            const appointmentsByDay = await app.models.appointment.aggregate([
                {
                    $match: {
                        createdAt: { $gte: start, $lte: end }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            // Appointment-related audit events
            const appointmentEvents = await app.models.auditTrail.aggregate([
                {
                    $match: {
                        dateTime: { $gte: start, $lte: end },
                        event: {
                            $in: [
                                'APPOINTMENT_CONFIRMED',
                                'APPOINTMENT_CANCELLED',
                                'APPOINTMENT_RESCHEDULED',
                                'APPOINTMENT_STARTED_BY_DOCTOR',
                                'APPOINTMENT_CLOSED_BY_DOCTOR'
                            ]
                        }
                    }
                },
                {
                    $group: {
                        _id: "$event",
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } }
            ]);

            // Cancellation rate
            const confirmedCount = await app.models.auditTrail.countDocuments({
                dateTime: { $gte: start, $lte: end },
                event: 'APPOINTMENT_CONFIRMED'
            });
            const cancelledCount = await app.models.auditTrail.countDocuments({
                dateTime: { $gte: start, $lte: end },
                event: 'APPOINTMENT_CANCELLED'
            });
            const cancellationRate = confirmedCount > 0
                ? ((cancelledCount / confirmedCount) * 100).toFixed(2)
                : 0;

            return ResponseHandler.success(res, {
                totalAppointments,
                appointmentsByStatus,
                appointmentsByDay,
                appointmentEvents,
                metrics: {
                    confirmed: confirmedCount,
                    cancelled: cancelledCount,
                    cancellationRate: parseFloat(cancellationRate)
                }
            });

        } catch (error) {
            console.error('Appointment analytics error:', error);
            return ResponseHandler.error(res, new AppError(ErrorCodes.INTERNAL_SERVER_ERROR, error.message));
        }
    });

    // Get system health analytics
    app.get(route + '/system-health', async function (req, res, next) {
        try {
            const { startDate, endDate } = req.query;

            const end = endDate ? new Date(endDate) : new Date();
            const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);

            // Error events
            const errorEvents = await app.models.auditTrail.aggregate([
                {
                    $match: {
                        dateTime: { $gte: start, $lte: end },
                        category: 'error'
                    }
                },
                {
                    $group: {
                        _id: "$event",
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } }
            ]);

            // Error trends by day
            const errorsByDay = await app.models.auditTrail.aggregate([
                {
                    $match: {
                        dateTime: { $gte: start, $lte: end },
                        category: 'error'
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: "%Y-%m-%d", date: "$dateTime" }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            // Failed operations
            const failedOperations = await app.models.auditTrail.aggregate([
                {
                    $match: {
                        dateTime: { $gte: start, $lte: end },
                        event: {
                            $regex: /FAILED|ERROR|INVALID/i
                        }
                    }
                },
                {
                    $group: {
                        _id: "$event",
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } }
            ]);

            // Total events for success rate calculation
            const totalEvents = await app.models.auditTrail.countDocuments({
                dateTime: { $gte: start, $lte: end }
            });
            const totalErrors = await app.models.auditTrail.countDocuments({
                dateTime: { $gte: start, $lte: end },
                category: 'error'
            });
            const successRate = totalEvents > 0
                ? (((totalEvents - totalErrors) / totalEvents) * 100).toFixed(2)
                : 100;

            return ResponseHandler.success(res, {
                errorEvents,
                errorsByDay,
                failedOperations,
                metrics: {
                    totalEvents,
                    totalErrors,
                    successRate: parseFloat(successRate)
                }
            });

        } catch (error) {
            console.error('System health analytics error:', error);
            return ResponseHandler.error(res, new AppError(ErrorCodes.INTERNAL_SERVER_ERROR, error.message));
        }
    });

    // Get content analytics
    app.get(route + '/content', async function (req, res, next) {
        try {
            const { startDate, endDate } = req.query;

            const end = endDate ? new Date(endDate) : new Date();
            const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);

            // Content access events
            const contentEvents = await app.models.auditTrail.aggregate([
                {
                    $match: {
                        dateTime: { $gte: start, $lte: end },
                        event: {
                            $in: [
                                'VISIT_RECORD_OPENED',
                                'PRESCRIPTION_OPENED',
                                'PRESCRIPTION_PRINTED',
                                'ATTACHMENT_OPENED',
                                'EMR_FETCHED',
                                'REMINDER_OPENED'
                            ]
                        }
                    }
                },
                {
                    $group: {
                        _id: "$event",
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } }
            ]);

            // Content access by day
            const contentByDay = await app.models.auditTrail.aggregate([
                {
                    $match: {
                        dateTime: { $gte: start, $lte: end },
                        event: {
                            $in: [
                                'VISIT_RECORD_OPENED',
                                'PRESCRIPTION_OPENED',
                                'ATTACHMENT_OPENED',
                                'EMR_FETCHED'
                            ]
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            date: { $dateToString: { format: "%Y-%m-%d", date: "$dateTime" } },
                            event: "$event"
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { "_id.date": 1 } }
            ]);

            return ResponseHandler.success(res, {
                contentEvents,
                contentByDay
            });

        } catch (error) {
            console.error('Content analytics error:', error);
            return ResponseHandler.error(res, new AppError(ErrorCodes.INTERNAL_SERVER_ERROR, error.message));
        }
    });

};
