var mongoose = require('mongoose');
const ResponseHandler = require('../utils/ResponseHandler');
const AppError = require('../utils/AppError');
const ErrorCodes = require('../utils/ErrorCodes');

module.exports = function (app, route) {

    var User = mongoose.model('User', app.models.user);

    app.get(route + '/reboot', (req, res) => {
        try {
            var reqUser = req.user;

            User.findById(reqUser._id, function (errUSer, user) {

                if (errUSer) {
                    console.log('Error finding user:', errUSer);
                    return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, 'Invalid user'));
                }

                if (!user) {
                    return ResponseHandler.error(res, new AppError(ErrorCodes.NOT_FOUND, 'User not found'));
                }

                if (user.roles && user.roles.root) {

                    console.log('Server rebooting');
                    // process.exit(1);

                    setTimeout(function () {

                        process.on("exit", function () {

                            console.log('Server starting');

                            var msg = {
                                code: 'INIT_APP_REBOOT',
                                message: 'Initiating app server reboot.'
                            }

                            ResponseHandler.success(res, msg);


                            require("child_process").spawn(process.argv.shift(), process.argv, {
                                cwd: process.cwd(),
                                detached: true,
                                stdio: "inherit"
                            });
                        });

                        process.exit();

                    }, 1000);

                } else {
                    console.log('Insufficient privilege for user:', user._id);
                    return ResponseHandler.error(res, new AppError(ErrorCodes.FORBIDDEN, 'Insufficient privilege. Not authorised to reboot the app'));
                }

            });
        } catch (error) {
            console.log('Error in reboot endpoint:', error);
            return ResponseHandler.error(res, new AppError(ErrorCodes.INTERNAL_SERVER_ERROR, error.message || 'Error processing reboot request'));
        }

    });


    // Return middleware
    return function (req, res, next) {
        next();
    };

}