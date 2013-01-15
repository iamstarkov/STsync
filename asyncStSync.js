var fs = require('fs'),
	_  = require('underscore'),
	moment = require('moment');
	GitHubApi = require('github'),
	github = new GitHubApi( {version: '3.0.0'} );


STsync = function () {
	
	this.settingsFolder = './settings/';
	this.settingsFile = this.settingsFolder + 'stsync.sublime-settings';
	this.lastUpdateFile = 'stsync.last-sync';
	this.syncIsGoing = false;
	
	this.username = process.argv[2];
	this.password = process.argv[3];
	console.log(this.username, this.password);

	github.authenticate({
		type: 'basic',
		username: this.username,
		password: this.password
	});


	this.updateLocal = function () {
		console.log('updateLocal');
		var self = this;
		// body...
	};

	this.updateRemote = function () {
		console.log('updateRemote');
		var self = this;
	};

	this.getGist = function (cb) {
		console.log('getGist');
		var self = this;

		github.gists.get(
			{
				id: self.options('gistId')
			},
			function (err, res) {
				cb(err, res);
			}
		);
	};

	this.getLocalFiles = function () {
		console.log('getLocalFiles');
		var self = this;

		var files = {};

		_.each(
			fs.readdirSync(self.settingsFolder),
			function (element, index, list) {
				files[element] = {
					'content': fs.readFileSync('./'+self.settingsFolder+'/'+element, 'utf-8')
				};
			}
		);

		return files;
	};

	this.getRemoteLastUpdate = function(gist) {
		console.log('getRemoteLastUpdate');
		var self = this;
		
		return gist.files[self.lastUpdateFile].content;
	};
	
	this.getLocalLastUpdate = function() {
		console.log('getLocalLastUpdate');
		var self = this;

		return fs.readFileSync(
			self.settingsFolder+self.lastUpdateFile,
			'utf-8'
		);
	};
	
	this.updateLocalLastUpdate = function() {
		console.log('updateLocalLastUpdate');
		var self = this;

		var asd = _.max(
			_.map(
				fs.readdirSync(self.settingsFolder),
				function (file, index, list) {
					return moment(
						fs.statSync(self.settingsFolder+file).mtime
					).unix();
				}
			)
		);

		fs.writeFileSync(
			self.settingsFolder+self.lastUpdateFile,
			new Date().getTime(),
			'utf-8'
		);
		// console.log(asd);
	};
	
	this.init = function (cb) {
		console.log('init');
		var self = this;
		
		if ( self.isValidGistId( self.options('gistId') ) ) {
			cb();
		} else {
			createGistId(cb);
		}
	};

	this.runSync = function () {
		console.log('runSync');
		var self = this;

		setInterval(function () {
			if (!self.syncIsGoing) {
				self.doSync();
			}
		}, ~~self.options('updateFrequency') );
	};

	this.doSync = function () {
		console.log('doSync');
		var self = this;

		self.syncIsGoing = true;
		
		getGist(function (err, res) {
			if (!err) {
				
				var localUpdate = self.getLocalLastUpdate();
				var remoteUpdate = self.getRemoteLastUpdate(res);

				console.log(localUpdate);
				console.log(remoteUpdate);

				self.syncIsGoing = false;
			}
		});


		
	};

	this.createGistId = function (cb) {
		console.log('getGistId');
		var self = this;

		getAllGists(1, self.getOptions().perPage, null, function (err, res) {
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

			if ((validGist) && self.isValidGistId(validGist.id)) {

				console.log('valid gist id');

				self.options('gistId', validGist.id);

				cb();

			} else {

				console.log('not valid gist id');
				createGist(function (err, res) {

					self.options('gistId', res.id);

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

	this.createGist = function (cb) {
		console.log('createGist');
		var self = this;
		self.updateLocalLastUpdate();

		github.gists.create(
			{
				'description': 'optional desc: ',
				'public': true,
				"files": self.getLocalFiles()
			},
			function(err, res) {
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
		var required = self.getOptions().requiredFiles;

		// console.log(gistFiles);
		// console.log(required);
		var intersection = _.intersection(required, gistFiles);
		// console.log(intersection);

		return (required.length === intersection.length);
	};

	this.isValidGistId = function (id) {
		console.log('isValidGistId');
		var self = this;

		id = parseInt(id, 10);
		// console.log(id);
		// console.log(id);
		return (_.isNumber(id) && !_.isNaN(id));
	};

	this.options = function () {
		console.log('options');
		var self = this;

		var first, second;
		if (arguments[0]) {
			first = arguments[0];
		}
		if (arguments[1]) {
			second = arguments[1];
		}

		switch (arguments.length) {
			case 0:
				return self.getOptions();
			case 1:
				if (_.isString(first)) {
					return self.getOptions()[first];
				}
				if (_.isObject(first)) {
					return self.setOptions()[first];
				}
				break;
			case 2:
				var newSettings = self.getOptions();
				newSettings[first] = second;
				self.setOptions(newSettings);
				break;
		}
	};
	
	this.getOptions = function () {
		console.log('getOptions');
		var self = this;

		var st =  fs.readFileSync(self.settingsFile, 'utf-8');

		st = eval('(' + st + ')');

		return st;
	};

	this.setOptions = function (settings) {
		console.log('setOptions');
		var self = this;
		
		settings = JSON.stringify(settings);

		settings = settings
			.replace(/\{/g, "{\n")
			.replace(/,/g, ",\n")
			.replace(/\n"/g, "\n\t\"")
			.replace(/:/g, ": ")
			.replace(/\[/g, "\n\t[\n\t")
			.replace(/\]/g, "\n\t]")
			.replace(/\}/g, "\n}")
		;

		fs.writeFileSync(this.settingsFile, settings, 'utf-8');
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