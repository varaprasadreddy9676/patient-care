
var mongoose = require('mongoose');

const ResponseHandler = require('../utils/ResponseHandler');
const AppError = require('../utils/AppError');
const ErrorCodes = require('../utils/ErrorCodes');


module.exports = function (app, route) {

	app.get(route, function (req, res, next) {

		var searchStr = req.query.searchStr;

		var City = mongoose.model('City', app.models.city);

		City.find({
				cityName: {
					'$regex': '^' + searchStr,
					'$options': 'i'
				}
			})
			.sort({
				cityName: 1
			})

			.exec(function (err, cities) {
				if (err) {
					console.error(err);
					return ResponseHandler.error(res, new AppError(ErrorCodes.DATABASE_ERROR, err.message || err));
				} else {
					return ResponseHandler.success(res, cities);
				}
			});
	});

	// Return middleware
	return function (req, res, next) {
		next();
	};

};