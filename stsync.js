var fs = require('fs'),
	_  = require('underscore'),
	Step  = require('step'),
	GitHubApi = require('github'),
	github = new GitHubApi( {version: '3.0.0'} );

var stsync = function (path, login, pswd) {
	
	this.path = path;
	this.file = 'stsync.sublime-settings',
	this.settings = fs.readFileSync(this.path+this.file, 'utf-8'),
	this.perPage = 100;
	

	this.login = login;
	this.pswd = pswd;

	github.authenticate({
		type: 'basic',
		username: this.login,
		password: this.pswd
	});

	this.getGistId = function () {
		var self  = this,
			settings = self.settings,
			gistId = settings.gistId;
		
		if (_.isNumber(gistId) && !_.isNaN(gistId)) {
			return gistId;
		} else {


		}

	};

	this.getAllGists = function () {
		var self  = this,
			settings = self.settings;
		
		var gists,
			pageNumber = 1,
			pageGists;

		pageGists = self.getGistsFromPage(pageNumber);
		console.log(4, pageGists);
		
		gists = _.union(gists, pageGists);
		// console.log(gists.length);
		
		pageNumber++;
		
		console.log(5);
		return gists;
	};
	
	this.getGistsFromPage = function (pageNumber) {
		var self  = this,
			settings = self.settings;

		var pageGists = null;
		
		console.log(1);
		github.gists.getFromUser(
			{
				'user': self.login,
				'page': pageNumber,
				'per_page': self.perPage
			},
			function (err, res) {
				console.log(2);
				if (err) {
					console.error(err);
					return -1;
				}
				
				pageGists = res;
			}
		);

		
		console.log(3);
		return pageGists;
	};

	this.isValidSettings = function (gistFiles) {
		var self  = this,
			settings = self.settings,
			required = settings.requiredForValidation;

		gistFiles = _.map(gistFiles, function (value, key, list) {
			return key;
		});


		return (required == _.intersection(required, gistFiles));

	};


};

module.exports = stsync;