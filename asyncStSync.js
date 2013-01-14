var fs = require('fs'),
	_  = require('underscore'),
	Step  = require('step'),
	GitHubApi = require('github'),
	github = new GitHubApi( {version: '3.0.0'} );

STsync = function () {
	
	this.settingsFile = './settings/stsync.sublime-settings';
	this.syncIsGoing = false;
	
	this.username = process.argv[2];
	this.password = process.argv[3];
	console.log(this.username, this.password);

	github.authenticate({
		type: 'basic',
		username: this.username,
		password: this.password
	});

	this.getPluginSettings = function () {
		console.log('getPluginSettings');
		var self = this;
		//
		// console.log(self.settingsFile);
		//
		var st =  fs.readFileSync(self.settingsFile, 'utf-8');
		// console.log(typeof st);
		st = eval('(' + st + ')');
		// console.log(typeof st);
		return st;
	};

	this.setPluginSettings = function (settings) {
		console.log('setPluginSettings');
		var self = this;
		
		// console.log(typeof settings);
		// console.log(settings);
		settings = JSON.stringify(settings);
		// console.log(typeof settings, '===================');
		settings = settings
			.replace(/\{/g, "{\n")
			.replace(/,/g, ",\n")
			.replace(/\n"/g, "\n\t\"")
			.replace(/:/g, ": ")
			.replace(/\[/g, "\n\t[\n\t")
			.replace(/\]/g, "\n\t]")
			.replace(/\}/g, "\n}")
		;
		console.log(settings);

		fs.writeFileSync(this.settingsFile, settings, 'utf-8');
	};

	this.init = function (cb) {
		console.log('init');
		var self = this;
		
		if (self.isValidGistId(self.getPluginSettings().gistId)) {
			cb();
		} else {
			getGistId(cb);
		}
		
	};


	this.runSync = function () {
		console.log('runSync');
		var self = this;

		setInterval(function () {
			if (!self.syncIsGoing) {
				self.doSync();
			}
		}, ~~self.getPluginSettings().updateFrequency);

	};

	this.doSync = function () {
		console.log('doSync');
		var self = this;
		self.syncIsGoing = true;

		
		self.syncIsGoing = false;
	};

	this.getGistId = function (cb) {
		console.log('getGistId');
		var self = this;

		getAllGists(1, self.getPluginSettings().perPage, null, function (err, res) {
			console.log('getGistId callback');
			console.log(typeof res);
			var validGist = _.find(
				res,
				function (gist) {
					if (gist) {
						return self.isValidSettings(gist);
					}
				}
			);

			// console.log(validGist.id);
			// console.log(typeof validGist.id);
			// console.log('validGist.id', validGist.id);
			

			if ((validGist) && self.isValidGistId(validGist.id)) {
				console.log('valid gist id');
				var newSettings = self.getPluginSettings();
				
				newSettings.gistId = ~~validGist.id;
				self.setPluginSettings(newSettings);

				cb();

			} else {
				console.log('not valid gist id');
				createGist(function (err, res) {

					
					var newSettings = self.getPluginSettings();
					
					newSettings.gistId = res.id;
					self.setPluginSettings(newSettings);

					cb();

				});
			}

		});
	};

	this.getAllGists = function (pageNumber, perPage, accumulator, cb) {
		console.log('getAllGists');
		var self = this;

		github.gists.getFromUser(
			{
				'user': self.username,
				'page': pageNumber,
				'per_page': perPage
			},
			function (err, res) {
				console.log('getAllGists done ', pageNumber, ' page');
				accumulator = _.union(res, accumulator);
				
				if (_.isEqual( res.length, perPage)) {
					// not last page
					getAllGists(++pageNumber, perPage, accumulator, cb);

				} else {
					// last page, return all accumulated gists
					console.log('getAllGists ended');
					cb(err, accumulator);
				}

			}
		);
		
	};

	this.processFilesForExport = function () {
		
	};

	this.createGist = function (cb) {
		console.log('createGist');
		var self = this;

		var files = {
			"file1.txt": {
				"content": "String file contents"
			}
		};

		github.gists.create(
			{
				'description': 'optional desc: ',
				'public': true,
				"files": files
			},
			function(err, res) {
				// console.log(res);
				cb(err, res);
			}
		);
		
	};

	this.isValidSettings = function (gist) {
		console.log('isValidSettings');
		var self = this;
		var gistFiles = _.map(gist.files, function(value, key) {
			// console.log(key);
			// console.log(value);
			return key;
		});
		var required = self.getPluginSettings().requiredFiles;

		// console.log(gistFiles);
		// console.log(required);
		var intersection = _.intersection(required, gistFiles);
		// console.log(intersection);

		return (required.length === intersection.length);
	};

	this.isValidGistId = function (id) {
		console.log('isValidGistId');
		id = parseInt(id, 10);
		// console.log(id);
		// console.log(id);
		return (_.isNumber(id) && !_.isNaN(id));
	};



	
	//
	this.init(this.runSync);
	//
	
	/*
	
	this.createGist(function (err, res) {
		console.log(res.id);
	});
	 */

	
	
}();

