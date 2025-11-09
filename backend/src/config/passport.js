var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var app = require('../../medics-care');

passport.use(new LocalStrategy({
      usernameField: 'userName'
    },

    function(userName, password, done) {
	console.log('Checking credentials for ...... ' + userName);
	
	var User = mongoose.model('User', app.models.user);
		
	User.findOne({ userName: userName }, function (err, user) {
	    if (err) { return done(err); }

	    if (!user) {
		console.log('User name and password does not match!!!!!!!!!!!!');
		
		return done(null, false, {
		    message: 'User name and Password do not match'
		});
	    }
	    
	    // Return if password is wrong
	    if (!user.validPassword(password)) {
		console.log('User name and password does not match!!!!!!!!!!!!');
		
		return done(null, false, {
		    message: 'User name and Password do not match'
		});
	    }

	});
    }));



