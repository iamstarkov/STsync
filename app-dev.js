// app.js
var stsync = require('./stsync.js');
var _   = require('underscore');

var args     = process.argv.slice(2);
var folder   = args[0];
var username = args[1];
var password = args[2];

var OAUTH = {
	appId: '5f4f0546d36a62e59428',
	appSecret: '90abc81d07fd055bb9a44fc018ef5b8bbe70c459',
	host: 'localhost',
	port: 2121
};

var app = stsync();
app.relativePath = './Data/Packages/'; // folder

if (_.isUndefined(username)) {
	app.auth( OAUTH, app.runSync );
} else {
	app.auth( username, password, app.runSync );
}
