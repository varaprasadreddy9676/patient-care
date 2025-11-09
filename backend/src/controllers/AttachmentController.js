var restful = require('node-restful');
var mongoose = require('mongoose');
var httpService = require('../services/HTTPService.js');
var auditTrailService = require('../services/AuditTrailService.js');
// const attachmentService = require('../services/AttachmentService.js');

const ResponseHandler = require('../utils/ResponseHandler');
const AppError = require('../utils/AppError');
const ErrorCodes = require('../utils/ErrorCodes');
const SelectedFamilyMemberHelper = require('../utils/SelectedFamilyMemberHelper');


module.exports = function(app, route) {

    var resource = restful.model('family_member_attachment', app.models.familyMemberAttachment);
    var rest = resource.methods(['get', 'put', 'post', 'delete']);

    const FamilyMemberAttachment = mongoose.model('family_member_attachment', app.models.familyMemberAttachment);
    var FamilyMemberHospitalAccount = mongoose.model('family_member_hospital_account', app.models.familyMemberHospitalAccount);
    var FamilyMember = mongoose.model('family_member', app.models.familyMember);

    // Add simple family member access validation (non-blocking, just for audit)
    rest.before('get', function(req, res, next) {
        const familyMemberId = req.query.familyMemberId || req.query.selectedFamilyMemberId;
        const userId = req.query.userId;

        // Only validate if both parameters are provided
        if (familyMemberId && userId) {
            // Simple ownership validation (non-blocking, just for audit/logging)
            SelectedFamilyMemberHelper.validateFamilyMemberOwnership(userId, familyMemberId, function(err, belongsToUser) {
                if (belongsToUser) {
                    console.log(`Family member ${familyMemberId} attachment access validated for user ${userId}`);
                } else {
                    console.warn(`Family member ${familyMemberId} attachment access attempted by user ${userId} - may not belong to user`);
                }
                next();
            });
        } else {
            next();
        }
    });

    rest.after('get', function(req, res, next) {

        let id = req.params.id;

        if (id) {
            next();
        } else {

            let data = res.locals.bundle;

            data.forEach(attachment => {
                attachment.base64DataURI = null;
            });

            const groupedByDateAttachments = data.reverse().reduce((acc, obj) => {
                const key = obj["datetime"].toDateString();
                if (!acc[key]) {
                    acc[key] = [];
                }
                // Add object to list for given key's value
                acc[key].push(obj);
                return acc;
            }, {});
            console.log("group", groupedByDateAttachments);

            return ResponseHandler.success(res, {
                "attachments": groupedByDateAttachments
            });
        }

    });

    rest.before('post', async function(req, res, next) {
        console.log(req.body);
        if (req.body.contentType === 'application/pdf') {
        let source = req.body.base64DataURI;    
        let thumbnail =  ''; // await attachmentService.generatePDFThumbnail(source.slice(28));
        req.body.thumbnailBase64DataURI = 'data:image/png;base64,' + thumbnail;
        }

        next();
    })


    app.get(route + '/contextAttachment', function(req, res, next) {

        let hospitalCode = req.query.hospitalCode;
        let contextId = req.query.contextId;
        let contextType = req.query.contextType;
        let addBase64String = req.query.addBase64String == 'true' ? true : null;

        let body = {
            'entityCode': hospitalCode,
            'contextId': contextId,
            'contextType': contextType,
            'addBase64String': addBase64String
        };

        let url = '/attachments';

        httpService.doGet(hospitalCode, url, body, success, error);

        function success(response) {

            if (response.data) {

                auditTrailService.log(req, auditTrailService.events.ATTACHMENT_OPENED,
                    'Attachments opened for ' + contextId); // @@ familyMember is not defined any where need to handle this

                return ResponseHandler.success(res, response);
            }

        }

        function error(error) {
            console.error('Error: ' + error);

            return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, error.message || error));

        }
    });


    app.get(route + '/resultAttachment', function(req, res, next) {

        let familyMemberId = req.query.familyMemberId || req.query.selectedFamilyMemberId;
        let userId = req.query.userId;

        // Simple ownership validation if userId is provided (non-blocking, just for audit)
        if (familyMemberId && userId) {
            SelectedFamilyMemberHelper.validateFamilyMemberOwnership(userId, familyMemberId, function(err, belongsToUser) {
                if (belongsToUser) {
                    console.log(`Family member ${familyMemberId} resultAttachment access validated for user ${userId}`);
                } else {
                    console.warn(`Family member ${familyMemberId} resultAttachment access attempted by user ${userId} - may not belong to user`);
                }
                // Proceed with original logic
                fetchFamilyMemberHospitalAccounts();
            });
        } else {
            // Proceed with original logic
            fetchFamilyMemberHospitalAccounts();
        }

        function fetchFamilyMemberHospitalAccounts() {
            FamilyMemberHospitalAccount.find({
                "familyMemberId": familyMemberId,
            }, function(errFamilyMemberHospitalAccount, familyMemberHospitalAccount) {

            if (errFamilyMemberHospitalAccount) {
                return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, errFamilyMemberHospitalAccount.message || errFamilyMemberHospitalAccount));
            }

            if (familyMemberHospitalAccount && familyMemberHospitalAccount.length > 0) {

                var attachments = [];
                var count = familyMemberHospitalAccount.length;

                familyMemberHospitalAccount.forEach(function(fmha, index) {

                    var hospitalCode = fmha.hospitalCode;
                    var patientId = fmha.patientId;
                    // var familyMemberId = fmha.familyMemberId;

                    // FamilyMember.findById(familyMemberId,
                    //     function (errFamilyMember, familyMember) {

                    let body = {
                        'entityCode': hospitalCode,
                        'patientID': patientId,
                        'getByPatientId': true
                    };

                    let url = '/attachments';

                    httpService.doGet(hospitalCode, url, body, success, error);

                    function success(response) {

                        if (response.data) {

                            attachments.push(response.data.attachments);

                            if (attachments.length === count) {

                                return ResponseHandler.success(res, attachments);

                            }

                        }

                    }

                    function error(error) {
                        console.error('Error: ' + error);

                        if (index === count - 1) {
                            return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, error.message || error));
                        }
                    }

                    // });

                });

            } else {
                return ResponseHandler.success(res, []);
            }
        });
        } // Close fetchFamilyMemberHospitalAccounts function
    }); // Close app.get resultAttachment

    app.get(route + '/contextAttachment/open', function(req, res, next) {

        let hospitalCode = req.query.hospitalCode;
        let attachmentId = req.query.attachmentId;

        let url = '/attachments/' + attachmentId;

        httpService.doGet(hospitalCode, url, null, success, error);

        function success(response) {
            console.log('Success: ' + JSON.stringify(response));
            return ResponseHandler.success(res, response);
        }

        function error(error) {
            console.error('Error: ' + error);
            return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, error.message || error));
        }
    });

    app.post(route + '/share', function(req, res, next) {

        let attachmentIds = req.body.attachmentIds;
        let hospitalCode = req.body.hospitalCode;
        let contextId = req.body.contextId;
        let contextType = req.body.contextType;
        let url = '/attachments';

        for (let i = 0; i < attachmentIds.length; i++) {

            let body = {
                "contextId": contextId + '',
                "contextType": contextType,
                "entityCode": hospitalCode + '',
                "category": "40210" // PATIENT DOCUMENT
            };


            FamilyMemberAttachment.findById(attachmentIds[i],
                function(familyMemberAttachmenterror, familyMemberAttachment) {

                    if (familyMemberAttachmenterror) {
                        return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, familyMemberAttachmenterror.message || familyMemberAttachmenterror));
                    }

                    if (familyMemberAttachment) {

                        body.fileName = familyMemberAttachment.fileName;
                        body.base64DataURI = familyMemberAttachment.base64DataURI;
                        body.thumbnailBase64DataURI = familyMemberAttachment.thumbnailBase64DataURI;
                        body.description = familyMemberAttachment.fileName;

                        httpService.doPost(hospitalCode, url, body, success, error);

                        function success(response) {

                            if (response.ERROR_MSG) {
                                let message = {
                                    code: 'UPLOADING_FAILED',
                                    message: response.ERROR_MSG
                                };
                                error(message);
                                return;

                            } else {

                                if (attachmentIds.length - 1 === i) {

                                    console.log('Success: ' + JSON.stringify(response));
                                    let message = {
                                        code: 'FILE_UPLOADING',
                                        message: 'All Attachments are successfully shared.'
                                    };
                                    return ResponseHandler.success(res, message);
                                }
                            }
                        }

                        function error(error) {
                            console.error('Error: ' + error);
                            return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, error.message || error));
                        }
                    }
                });
        }
    });

    app.post(route + '/resultAttachment/share', function(req, res, next) {

        let attachmentArray = req.body.attachmentArray;


        for (let i = 0; i < attachmentArray.length; i++) {


            let body = attachmentArray[i];


            httpService.doGet(attachmentArray[i].reportHospitalCode, '/attachments/' + attachmentArray[i].id, null, success, error);

            function success(attachmentResponse) {

                attachmentArray[i].base64DataURI = attachmentResponse.data.attachment.base64DataURI;


                httpService.doPost(attachmentArray[i].entityCode, '/attachments', attachmentArray[i], success, error);

                function success(response) {

                    if (response.ERROR_MSG) {
                        let message = {
                            code: 'UPLOADING_FAILED',
                            message: response.ERROR_MSG
                        };
                        error(message);
                        return;

                    } else {

                        if (attachmentArray.length - 1 === i) {

                            console.log('Success: ' + JSON.stringify(response));
                            let message = {
                                code: 'FILE_UPLOADING',
                                message: 'All Attachments are successfully shared.'
                            };
                            return ResponseHandler.success(res, message);
                        }
                    }
                }

                function error(error) {
                    console.error('Error: ' + error);
                    return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, error.message || error));
                }


            }

            function error(error) {
                console.error('Error: ' + error);
                return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, error.message || error));
            }

        }
    });

    app.delete(route + '/contextAttachment', function(req, res, next) {

        let attachmentIds = req.query.attachmentIds;
        let hospitalCode = req.query.hospitalCode;
        attachmentIds = attachmentIds.split(',');

        for (let i = 0; i < attachmentIds.length; i++) {

            let url = '/attachments/' + attachmentIds[i];

            httpService.doDelete(hospitalCode, url, null, success, error);

            function success(response) {
                // console.log('Success: ' + JSON.stringify(response));
                if (response) {

                    if (response.data.code === 'NOT_FOUND') {
                        error(response.data);
                        return;
                    } else if (response.data.code === 'DELETED') {

                        if (i === attachmentIds.length - 1) {
                            let count = attachmentIds.length > 1 ? "s" : ""
                            let message = {
                                code: response.data.code,
                                message: attachmentIds.length + " attachment" + count + " deleted."
                            };
                            return ResponseHandler.success(res, message);
                        }
                    }
                }
            }

            function error(error) {
                console.error('Error: ' + error);
                return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, error.message || error));
            }
        }
    });

    app.delete(route, function(req, res, next) {

        let attachmentIds = req.query.attachmentIds;
        attachmentIds = attachmentIds.split(',');

        for (let i = 0; i < attachmentIds.length; i++) {

            FamilyMemberAttachment.deleteOne({
                "_id": attachmentIds[i]
            }, (error, success) => {

                if (error) {
                    let message = {
                        code: 'DELETING_FAILED',
                        message: 'Unable to delete documents'
                    };
                    return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, error.message || error));
                }

                if (success) {
                    if (i === attachmentIds.length - 1) {

                        let message = {
                            code: 'FILE_DELETING',
                            message: 'All Attachments are successfully deleted.'
                        };
                        return ResponseHandler.success(res, message);
                    }
                }
            })
        }
    });
    // Wrap node-restful responses in standardized format
    rest.after('get', function(req, res, next) {
        const data = res.locals.bundle;
        return ResponseHandler.success(res, data);
    });

    rest.after('post', function(req, res, next) {
        const data = res.locals.bundle;
        if (data.message || data.errmsg) {
            return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, data.errmsg || data.message));
        }
        return ResponseHandler.success(res, data);
    });

    rest.after('put', function(req, res, next) {
        const data = res.locals.bundle;
        if (data.message || data.errmsg) {
            return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, data.errmsg || data.message));
        }
        return ResponseHandler.success(res, data);
    });

    rest.after('delete', function(req, res, next) {
        const data = res.locals.bundle;
        return ResponseHandler.success(res, data);
    });


    rest.register(app, route);
    // Return middleware
    return function(req, res, next) {
        next();
    };
};