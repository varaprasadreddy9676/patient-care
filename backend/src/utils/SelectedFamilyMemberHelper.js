var mongoose = require('mongoose');
var FamilyMember = mongoose.model('family_member');

/**
 * Utility functions for Selected Family Member filtering
 */

/**
 * Simple validation to check if family member belongs to logged-in user
 * @param {String} userId - The logged-in user ID
 * @param {String} selectedFamilyMemberId - The selected family member ID (optional)
 * @param {Function} callback - Callback function (err, belongsToUser)
 */
const validateFamilyMemberOwnership = function(userId, selectedFamilyMemberId, callback) {
    if (!selectedFamilyMemberId) {
        return callback(null, true); // No validation needed if not provided
    }

    FamilyMember.findOne({
        _id: mongoose.Types.ObjectId(selectedFamilyMemberId),
        userId: mongoose.Types.ObjectId(userId)
    }, function(err, familyMember) {
        if (err) {
            return callback(err, false);
        }
        // Just return whether it belongs to user, don't block access
        return callback(null, !!familyMember);
    });
};

/**
 * Adds family member filter to MongoDB query if selectedFamilyMemberId is provided
 * @param {Object} query - The existing MongoDB query object
 * @param {String} selectedFamilyMemberId - The selected family member ID (optional)
 * @returns {Object} - Updated query with family member filter if provided
 */
const addFamilyMemberFilter = function(query, selectedFamilyMemberId) {
    if (!selectedFamilyMemberId) {
        return query; // Return original query if no filter provided
    }

    return {
        ...query,
        familyMemberId: mongoose.Types.ObjectId(selectedFamilyMemberId)
    };
};

/**
 * Adds family member filter to FamilyMemberHospitalAccount query
 * @param {Object} query - The existing query object
 * @param {String} userId - The logged-in user ID
 * @param {String} selectedFamilyMemberId - The selected family member ID (optional)
 * @returns {Object} - Updated query with family member filter if provided
 */
const addFamilyMemberHospitalAccountFilter = function(query, userId, selectedFamilyMemberId) {
    const baseQuery = {
        userId: mongoose.Types.ObjectId(userId)
    };

    if (selectedFamilyMemberId) {
        baseQuery.familyMemberId = mongoose.Types.ObjectId(selectedFamilyMemberId);
    }

    return {
        ...query,
        ...baseQuery
    };
};

module.exports = {
    validateFamilyMemberOwnership,
    addFamilyMemberFilter,
    addFamilyMemberHospitalAccountFilter
};