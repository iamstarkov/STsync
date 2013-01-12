var GitHubApi = require('github');
var _ = require('underscore');
var fs = require('fs');
var moment = require('moment');
var Step = require('step');

var github = new GitHubApi({
	version: '3.0.0'
});

Step(
	function loadGist() {
		github.authenticate({
			type: 'basic',
			username: process.argv[2],
			password: process.argv[3]
		});

		var gistId = process.argv[4];
		var current = new Date().getTime();

		console.log('');
		console.log(gistId);
		console.log(current);

		github.gists.get(
			{
				id: gistId
			},
			this
		);

		/*
		
		var dates = [
			"2010-04-14T02:12:15Z",
			"2010-04-14T02:15:15Z",
			"2010-04-14T02:16:15Z",
			"2013-01-02T03:22:28Z"
		];
		 */
	},
	function doOtherStuff(err, res) {
		if (!err) {
			console.log(res);
		} else {
			console.log(err);
		}
		/*
		
		console.log('doOtherStuff');
		console.log(arguments);
		console.log(gist);
		 */
		// console.log(users);
	}
);





/*
var gist = getGist(github, gistId);

console.log('gist: ', gist);

dates =  _.map(dates, function (value, key) {
	return moment(value).unix()*1000;
});

// console.log(dates);
var lastUpdate = _.max(dates);
console.log(lastUpdate);




console.log(
	'local setting',
	(lastUpdate > current) ?
	'is outdated'
	: 'is up to date'
);
 */




