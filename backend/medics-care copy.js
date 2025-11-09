var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var Constants = require('./config/constants');
var methodOverride = require('method-override');
var https = require('https');
var http = require('http');
var fs = require('fs');
var _ = require('lodash');

var path = require('path');
//var favicon = require('serve-favicon');
var morgan = require('morgan');
var rfs = require('rotating-file-stream') // version 2.x

//var cookieParser = require('cookie-parser');
var passport = require('passport');

// Create the application
var app = module.exports = express();

//var jwt = require('express-jwt');

var jwt = require('jsonwebtoken');
var hospitalPolicyService = require('./src/services/HospitalPolicyService.js');

var BASE_URL = Constants.BASE_URL;


var accessLogStream = rfs.createStream('access.log', {
    interval: '1d', // rotate daily
    path: path.join(__dirname, 'log')
});

app.use(morgan('combined', { stream: accessLogStream }));

var errorLogStream = rfs.createStream('error.log', {
    interval: '1d', // rotate daily
    path: path.join(__dirname, 'log')
});

process.stdout.write = accessLogStream.write.bind(accessLogStream);
process.stderr.write = errorLogStream.write.bind(errorLogStream);

app.use(BASE_URL + '/public/images', express.static(__dirname + '/public/images/'));


// Add middleware necessary for REST APIs

app.use(methodOverride('X-HTTP-Method-Override'));

app.use(bodyParser.json({
    limit: '10mb'
}));

app.use(bodyParser.urlencoded({
    limit: '10mb',
    extended: true,
    parameterLimit: 10000
}));

// CORS Support
app.use(function(req, res, next) {

    console.log('Processing .... ' + req.url);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Request Body .... ' + JSON.stringify(req.body));
    }

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');

    if (req.method === 'OPTIONS') {
        //res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        return res.status(200).json({});
    } else {
        next();
    }

});


app.use(function(err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
        res.status(401);

        res.json({
            "message": err.name + ": " + err.message
        });
    } else {
        res.status(500);
        res.json({
            "message": err.name + ": " + err.message
        });
    }
});

var options = {
    db: {
        native_parser: true
    },
    server: {
        poolSize: 10
    },
}; // Other options....  replset: { rs_name: 'myReplicaSetName' }, user: 'myUserName', pass: 'myPassword'

mongoose.Promise = global.Promise;

     mongoose.connect('mongodb://localhost:27017/patient_app_db', options)

.then(() => {
    console.log("Successfully connected to the database");
}).catch(err => {
    console.log('Could not connect to the database. Exiting now...', err);
    process.exit();
});


mongoose.connection.once('open', function() {

    app.models = require('./models/index');

    app.use([BASE_URL + '/api/*'], function(req, res, next) {

        var authRequired = !(req.baseUrl.includes("/api/signup") || !req.baseUrl.includes("/api/signup") || req.baseUrl.includes("/api/signin") ||
            req.baseUrl.includes("/api/city") || req.baseUrl.includes("/api/user/verifyToken") ||
            req.baseUrl.includes("/api/appointment/start") || req.baseUrl.includes("/api/appointment/close") ||
            req.baseUrl.includes("/api/hospital") || req.baseUrl.includes("/api/prescription/ready") || req.baseUrl.includes("/api/externalLabReports")
        );

        if (req.method !== 'OPTIONS' && authRequired) {

            var authorization = req.headers.authorization;
            var token = authorization && authorization.split(" ").length == 2 ?
                authorization.split(" ")[1] : "";

            jwt.verify(token, Constants.SECRET_KEY, function(err, user) {
                if (err) {

                    if (err.name === 'TokenExpiredError') {

                        console.log('Token expired!!!');
                        res.status(401);

                        res.json({
                            'code': 'TOKEN_EXPIRED',
                            'message': err.message
                        });

                    } else {
                        res.sendStatus(401);

                        console.log('Authentication failed!!!');
                    }

                    //return res.json({ success: false, message: 'Failed to authenticate token.' });
                } else {
                    // console.log("Decoded User ...... " + JSON.stringify(user));

                    req.user = user;
                    next();
                }
            });

        } else {
            next();
        }
    });

    // Load the Routes
    var routes = require('./routes');

    _.each(routes, function(controller, route) {
        app.use(route, controller(app, route));
    });

    require('./src/config/passport.js');

    app.use(passport.initialize());

    process.on('uncaughtException', function(err) {
        console.log(err);
    });


    // Create an HTTP service.
    var httpPort = 3081;
    console.log('http => Listening on port ' + httpPort);
    http.createServer(app).listen(httpPort);

    hospitalPolicyService.init();


    require('./engines/SyncCities');
    require('./engines/PushNotifications');
    require('./engines/AppointmentReleaseReservedSlots');
    require('./engines/AppointmentCloseScheduledBookings');
    require('./engines/ConsultationNotStartedReminder');
    require('./engines/UpdateCallCenterAppointmentBookings');


});