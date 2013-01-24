// app.js
var sync = require('./stsync.js');
var _    = require('underscore');

var folder   = process.argv[2];
var username = process.argv[3];
var password = process.argv[4];

var OAUTH = {
	appId: '5f4f0546d36a62e59428',
	appSecret: '90abc81d07fd055bb9a44fc018ef5b8bbe70c459',
	host: 'localhost',
	port: 2121
};

sync();

if (_.isUndefined(username)) {
	sync().auth(
		OAUTH,
		function () {
			sync().init();
		}
	);
} else {
	sync().auth(
		username, password,
		function () {
			sync().init();
		}
	);
}


