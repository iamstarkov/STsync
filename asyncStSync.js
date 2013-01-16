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

	this.updateRemote = function (gist, cb) {
		console.log('updateRemote');
		var self = this;

		var remoteFiles = self.getGistFilesList(gist);
		var localFiles = self.getLocalFilesList();

		var deletingFilesList = _.difference(remoteFiles, localFiles);

		console.log('number of remoteFiles count\n\t', remoteFiles.length);
		console.log('number of localFiles\n\t', localFiles.length);
		console.log('number of filesToDelete\n\t', deletingFilesList.length);
		console.log('number of filesToAdd\n\t', _.difference(localFiles, remoteFiles).length);

		var existingFiles = self.getLocalFiles();
		var deletingFiles = self.getDeletingRemoteFiles(deletingFilesList);


		// console.log('existingFiles\n\t', existingFiles);
		// console.log('deletingFiles\n\t', deletingFiles);
		/*
		
		var files = existingFiles;
		if (deletingFiles.length !== 0) {
			files = _.extend(files, deletingFiles);
		}

		*/

		// console.log('files\n\t', files);
		var msg = {
			"id": gist.id,
			"description": gist.description,
			// "files": files
			// "files": deletingFiles
			"files": existingFiles
		};
		
		console.log('MSG\n', msg);

		github.gists.edit(
			msg,
			function(err, res) {
				if (err) {
					throw('FUCKING SHIT');
				}
				console.log('updateRemote callback');
				cb(err, res);
			}
		);

	};

	this.getGistFilesList = function (gist) {
		console.log('getGistFilesList');
		var self = this;
		return _.map(gist.files, function(value, key) {
			return key;
		});
	};
	
	this.getLocalFilesList = function () {
		console.log('getLocalFilesList');
		var self = this;
		return fs.readdirSync(self.settingsFolder);
	};

	this.getGist = function (cb) {
		console.log('getGist');
		var self = this;

		github.gists.get(
			{
				id: self.options('gistId')
			},
			function (err, res) {
				console.log('getGist callback');
				cb(err, res);
			}
		);
	};

	this.getDeletingRemoteFiles = function (filesLists) {
		console.log('getDeletingRemoteFiles');
		

		var files = {};

		_.each(filesLists, function (element, index, list) {
			files[element] = null;
		});

		return files;
	};

	this.getLocalFiles = function () {
		console.log('getLocalFiles');
		var self = this;

		var files = {};

		_.each(
			self.getLocalFilesList(),
			function (element, index, list) {
				files[element] = {
					"content": self.escapeQuotes(fs.readFileSync('./'+self.settingsFolder+'/'+element, 'utf-8'))
				};
			}
		);

		return files;
	};

	this.escapeQuotes = function(string) {
		// https://en.wikipedia.org/wiki/Quotation_mark#Typing_quotation_marks_on_a_computer_keyboard
		// https://en.wikipedia.org/wiki/Apostrophe#Entering_apostrophes
		// https://en.wikipedia.org/wiki/Prime_(symbol)#Representations
		return string
			.replace(/‘/g, "&lsquo;") // Single opening quote mark
			.replace(/’/g, "&rsquo;") // Single closing quote mark & Apostrophe
			.replace(/“/g, "&ldquo;") // Double opening quote mark
			.replace(/’/g, "&rdquo;") // Double closing quote mark
			.replace(/′/g, "&prime;") // Single prime
			.replace(/″/g, "&Prime;") // Double prime
			.replace(/″/g, "&Prime;") // Double prime
			.replace(/‴/g, "U+2034")  // Triple prime
			.replace(/‴/g, "U+2034")  // Triple prime
			.replace(/⁗/g, "U+2057")  // Quadruple prime
			.replace(/ʹ/g, "U+02B9")  // Modifier letter prime
			.replace(/ʺ/g, "U+2057")  // Modifier letter double prime
		;
	};

	this.unescapeQuotes = function(string) {
		// https://en.wikipedia.org/wiki/Quotation_mark#Typing_quotation_marks_on_a_computer_keyboard
		// https://en.wikipedia.org/wiki/Apostrophe#Entering_apostrophes
		// https://en.wikipedia.org/wiki/Prime_(symbol)#Representations
		return string
			.replace(/&lsquo;/g, "‘") // Single opening quote mark
			.replace(/&rsquo;/g, "’") // Single closing quote mark & Apostrophe
			.replace(/&ldquo;/g, "“") // Double opening quote mark
			.replace(/&rdquo;/g, "’") // Double closing quote mark
			.replace(/&prime;/g, "′") // Single prime
			.replace(/&Prime;/g, "″") // Double prime
			.replace(/&Prime;/g, "″") // Double prime
			.replace(/U+2034/g, "‴")  // Triple prime
			.replace(/U+2034/g, "‴")  // Triple prime
			.replace(/U+2057/g, "⁗")  // Quadruple prime
			.replace(/U+02B9/g, "ʹ")  // Modifier letter prime
			.replace(/U+2057/g, "ʺ")  // Modifier letter double prime
		;
	};

	this.getRemoteLastUpdate = function (gist) {
		console.log('getRemoteLastUpdate');
		var self = this;
		
		return gist.files[self.lastUpdateFile].content;
	};

	this.getLocalLastUpdate = function () {
		console.log('getLocalLastUpdate');
		var self = this;

		return fs.readFileSync(
			self.settingsFolder+self.lastUpdateFile,
			'utf-8'
		);
	};
	
	this.updateLocalLastUpdate = function () {
		console.log('updateLocalLastUpdate');
		var self = this;

		var filesMtime = _.compact(
			_.map(
				fs.readdirSync(self.settingsFolder),
				function (file, index, list) {
					var mtime, mtime_unix;
					if (file != self.lastUpdateFile) {
						mtime = fs.statSync(self.settingsFolder+file).mtime;
						mtime_unix = moment(mtime).unix();

						return mtime_unix;
					}
				}
			)
		);

		var folderMtime = moment(
			fs.statSync(self.settingsFolder).mtime
		).unix();

		var mtimes = _.union(filesMtime, folderMtime);

		var lastUpdateNew = _.max(mtimes);


		// console.log('\tfilesMtime', filesMtime);
		// console.log('\tfolderMtime', folderMtime);
		// console.log('\tmtimes', mtimes);
		// console.log('\tlastUpdateNew', lastUpdateNew);




		/*
		console.log('lastUpdateNew\n\t', lastUpdateNew);
		console.log('getLocalLastUpdate\n\t', self.getLocalLastUpdate() );
		 */


		if (
			parseInt(lastUpdateNew, 10) !== parseInt(self.getLocalLastUpdate(), 10)
		) {
			// console.log('Local files was updated');
			fs.writeFileSync(
				self.settingsFolder+self.lastUpdateFile,
				lastUpdateNew,
				'utf-8'
			);
		} else {
			// console.log('Nothing happens here');
		}
		/*
		 */
		// console.log(asd);
	};
	
	this.init = function (cb) {
		console.log('init');
		var self = this;
		
		if ( self.isValidGistId( self.options('gistId') ) ) {
			cb();
		} else {
			findGistId(cb);
		}
	};

	this.runSync = function () {
		console.log('runSync');
		var self = this;


		/*
		if (!self.syncIsGoing) {
			self.doSync();
		}
		*/

		setInterval(function () {
			if (!self.syncIsGoing) {
				self.doSync();
			}
		}, ~~self.options('updateFrequency') );
	};

	this.doSync = function () {
		console.log('\n\t==================');
		console.log('doSync');
		var self = this;
		
		self.syncIsGoing = true;

		getGist(function (err, res) {
			if (!err) {
				self.updateLocalLastUpdate();
				
				var localUpdate = self.getLocalLastUpdate();
				var remoteUpdate = self.getRemoteLastUpdate(res);

				if (localUpdate != remoteUpdate) {
					console.log('sync required');
					console.log('delta: ', localUpdate - remoteUpdate);

					if (localUpdate > remoteUpdate) {
						console.log('REMOTE required sync');

						self.updateRemote(res, function (err, res) {
							console.log('remote update successfull');
						});
					} else {
						console.log('LOCAL required sync');
					}
				} else {
					console.log('All is already synced, congrats');
				}

				self.syncIsGoing = false;
			}
		});
	};

	this.findGistId = function (cb) {
		console.log('findGistId');
		var self = this;


		getAllGists(1, ~~self.options('perPage'), null, function (err, res) {
			console.log('findGistId callback');
			// console.log(typeof res);
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
		var gistFiles = this.getGistFilesList(gist);
		var required = self.getOptions().requiredFiles;

		// console.log(gistFiles);
		// console.log(required);
		var intersection = _.intersection(required, gistFiles);
		// console.log(intersection);

		// return (required.length === intersection.length);
		return _.isEqual(required, intersection);
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
	var self = this
	
	// self.updateLocalLastUpdate();
	
	setInterval(function () {
		console.log('----')
		self.updateLocalLastUpdate();
		console.log(
			'\t' + self.getLocalLastUpdate()
		);
	}, 1000);
	 */
	/*
	 */

	/*
	this.createGist(function (err, res) {
		console.log(res.id);
	});
	*/

}();