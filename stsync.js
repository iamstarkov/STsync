// STsync
var fs = require('fs'),
	_  = require('underscore'),
	moment = require('moment');

	GitHubApi = require('github'),
	github = new GitHubApi( {version: '3.0.0'} ),


	winston = require('winston');
	winston.add(
		winston.transports.File,
		{
			filename: './logs/'+moment().format('LL')+'.txt',
			maxFiles: 30,
			maxsize: 10000000 // 10M Bytes ~ 10k Kbytes ~ 10 Mbytes
		}
	);
	winston.remove(winston.transports.Console);

	// winston.info('Hello again distributed logs');


// Passport
var express = require('express'),
	passport = require('passport'),
	util = require('util'),
	forceOpen = require('open'),
	GitHubStrategy = require('passport-github').Strategy;

// Extend underscore with my helpful mini functions;
_.mixin({
	unixSec2mtime : function(unixSec) {
		// return moment.utc(unixSec*1000).format("ddd, DD MMM YYYY HH:mm:ss ZZ");
		// return moment(unixSec*1000).format("ddd, DD MMM YYYY HH:mm:ss");
		// return moment(unixSec*1000);
		return moment(unixSec*1000)/1000;
	},
	mtime2unixSec : function(mtime) {
		return moment(mtime).unix();
	},
	getJSON : function (JSONstring) {
		return eval('(' + JSONstring + ')');
	},
	formatJSON : function (JSONstring) {
		return JSONstring
					.replace(/\{/g, "{\n")       // new line after ‘{’
					.replace(/,/g, ",\n")        // new line after ‘,’
					.replace(/\n"/g, "\n\t\"")   // one tab indentaion first-level options
					.replace(/:/g, ": ")         // space after ‘:’
					.replace(/\[/g, "\n\t[\n\t") // new line before array
					.replace(/\]/g, "\n\t]")     // new line after array
					.replace(/\}/g, "\n}")       // new line after ‘}’
		;
	},
	readFile : function (file) {
		return fs.readFileSync(file, 'utf-8');
	},
	writeFile : function (file, content) {
		fs.writeFileSync(file, content, 'utf-8');
	},
	getAtime : function (file) {
		return fs.statSync(file).atime;
	},
	getMtime : function (file) {
		return fs.statSync(file).mtime;
	},
	updateMtime : function (file, mtime) {
		fs.utimesSync(
			file,
			_.getAtime(file),
			mtime
		);
	},
	escapeQuotes : function (string) {
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
			.replace(/‴/g, "U+2034")  // Triple prime
			.replace(/⁗/g, "U+2057")  // Quadruple prime
			.replace(/ʹ/g, "U+02B9")  // Modifier letter prime
			.replace(/ʺ/g, "U+2057")  // Modifier letter double prime
		;
	},
	unescapeQuotes : function (string) {
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
			.replace(/U+2034/g, "‴")  // Triple prime
			.replace(/U+2057/g, "⁗")  // Quadruple prime
			.replace(/U+02B9/g, "ʹ")  // Modifier letter prime
			.replace(/U+2057/g, "ʺ")  // Modifier letter double prime
		;
	},
	isPositiveInteger : function (number) {
		number = parseInt(number, 10);
		return (_.isNumber(number) && !_.isNaN(number));
	},
	ghGetGistById : function (id, cb) {
		github.gists.get(
			{
				"id": id
			},
			function (err, res) {
				if (err) throw err;
				cb(res);
			}
		);
	},
	ghCreateGist : function(msg, cb) {
		github.gists.create(
			msg,
			function(err, res) {
				if (err) throw err;

				cb(res);
			}
		);
	},
	ghGetAllGists : function (username, pageNumber, perPage, accumulator, cb) {
		github.gists.getFromUser(
			{
				'user': username,
				'page': pageNumber,
				'per_page': perPage
			},
			function (err, res) {
				if (err) throw err;

				accumulator = _.union(res, accumulator);
				
				if (_.isEqual( res.length, perPage)) {
					// not last page
					_.ghGetAllGists(username, ++pageNumber, perPage, accumulator, cb);

				} else {
					// last page, return all accumulated gists
					cb(accumulator);
				}

			}
		);
	}
});


STsync = function () {

	// this.settingsFolder = './settings/';
	this.lastUpdateFile = 'stsync.last-update';

	this.generalSettingsFile = './stsync.sublime-settings';


	this.syncIsGoing = false;

	//
	// OAUTH
	//
	
	this.auth = function () {
		var self = this;

		cb = _.last(arguments);

		args = _.initial(arguments);


		if (args.length == 1 && _.isObject( args[0]) ) {
			self.authByOAUTH(args[0], cb);
		}

		if (args.length == 2) {
			self.authByPassword(args[0], args[1], cb);
		}

		return self;
	};

	this.authByPassword = function (username, password, cb) {
		var self = this;
		
		self.username = username;

		github.authenticate({
			"type": "basic",
			"username": username,
			"password": password
		});

		cb();
	
		return self;
	};
	
	this.authByOAUTH = function (options, cb) {
		var self = this;

		// console.log(options);

		// options
		//     appId
		//     appSecret
		//     host
		//     port

		passport.serializeUser(function(user, done) {
			done(null, user);
		});

		passport.deserializeUser(function(obj, done) {
			done(null, obj);
		});


		passport.use(new GitHubStrategy(
			{
				clientID: options.appId,
				clientSecret: options.appSecret,
				callbackURL: "http://"+options.host+":"+options.port+"/auth/github/callback",
				scope: ["gist"]
			},
			function(accessToken, refreshToken, profile, done) {
	
		
				self.username = profile._json.login;
				self.token = accessToken;

				github.authenticate({
					"type": "oauth",
					"token": self.token
				});

				cb();
				
				process.nextTick(function () {
					return done(null, profile);
				});
			}
		));




		var app = express();

		// configure Express
		app.configure(function() {
			app.set('views', __dirname + '/views');
			app.set('view engine', 'ejs');
			// app.use(express.logger());
			app.use(express.cookieParser());
			app.use(express.bodyParser());
			app.use(express.methodOverride());
			app.use(express.session({ secret: 'keyboard cat' }));
			// Initialize Passport!  Also use passport.session() middleware, to support
			// persistent login sessions (recommended).
			app.use(passport.initialize());
			app.use(passport.session());
			app.use(app.router);
			app.use(express.static(__dirname + '/public'));
		});


		app.get('/', function(req, res){
			res.render('index', { user: req.user });
		});

		app.get('/account', ensureAuthenticated, function(req, res){
			res.render('account', { user: req.user });
		});

		app.get('/login', function(req, res){
			res.render('login', { user: req.user });
		});

		app.get(
			'/auth/github',
			passport.authenticate('github'),
			function(req, res) {
				console.log(res);
			}
		);

		app.get(
			'/auth/github/callback',
			passport.authenticate('github', { failureRedirect: '/login' }),
			function(req, res) {
				res.redirect('/');
			}
		);

		app.get('/logout', function(req, res){
			req.logout();
			res.redirect('/');
		});

		app.listen(options.port);

		forceOpen('http://'+options.host+':'+options.port+'/login');

		function ensureAuthenticated(req, res, next) {
			if (req.isAuthenticated()) { return next(); }
			res.redirect('/login');
		}
		
		return self;
	};

	//===========================================//

	//
	// LOCAL
	//

	this.updateLocal = function (gist, cb) {
		var self = this;

		var remoteFilesList = self.getGistFilesList(gist);
		var localFilesList = self.getLocalFilesList();

		// files from localFilesList that are not present in the remoteFilesList
		var deletingFilesList = _.difference(localFilesList, remoteFilesList);
		
	
		_.each(deletingFilesList, function (element, index, list) {
			fs.unlinkSync(self.settingsFolder+element);
		});
		

		
		var lastUpdSec = gist.files[self.lastUpdateFile].content;
		_.each(remoteFilesList, function (element, index, list) {

			var filePath = self.settingsFolder+element;
			_.writeFile(filePath, gist.files[element].content);
			
			_.updateMtime(filePath, _.unixSec2mtime(lastUpdSec));
			
		});

		_.updateMtime(self.settingsFolder, _.unixSec2mtime(lastUpdSec));

		cb();
	};

	this.getLocalLastUpdate = function () {
		var self = this;
		var file = self.settingsFolder+self.lastUpdateFile;
		
		if (fs.existsSync(file)) {
			return _.readFile(file);
		} else {
			return 0;
		}
	};

	this.getLocalFilesList = function () {
		return fs.readdirSync(this.settingsFolder);
	};

	this.getLocalFiles = function () {
		var self = this;

		var files = {};

		_.each(
			self.getLocalFilesList(),
			function (element, index, list) {
				var fileContent = _.readFile(self.settingsFolder+element);

				// not to sync empty files, ’cause wtf and they brokes JSON
				if (fileContent !== '') {
					files[element] = {
						"content": _.escapeQuotes(fileContent)
					};
				}
			}
		);

		return files;
	};

	this.updateLocalLastUpdate = function () {
		var self = this;

		var filesMtime = _.compact(
			_.map(
				fs.readdirSync(self.settingsFolder),
				function (file, index, list) {
					var mtime, mtime_unix;
					if (file != self.lastUpdateFile) {
						mtime = fs.statSync(self.settingsFolder+file).mtime;
						return _.mtime2unixSec(mtime);
					}
				}
			)
		);
		
		// console.log('filesMtime', filesMtime.length, filesMtime);

		var folderMtime = _.mtime2unixSec(
			fs.statSync(self.settingsFolder).mtime
		);

		// console.log('folderMtime', folderMtime);

		filesMtime.push(folderMtime);

		var mtimes = filesMtime;

		// console.log('mtimes', mtimes.length, mtimes);


		var lastUpdateNew = _.max(mtimes);
		// console.log('lastUpdateNew', lastUpdateNew);


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
			console.log('Local files was updated and need to be synced');
			_.writeFile(
				self.settingsFolder+self.lastUpdateFile,
				lastUpdateNew
			);
		} else {
			console.log('Nothing happens here');
		}
	};

	//===========================================//

	//
	// REMOTE
	//

	this.updateRemote = function (gist, cb) {
		var self = this;

		var remoteFilesList = self.getGistFilesList(gist);
		var localFilesList = self.getLocalFilesList();

		var deletingFilesList = _.difference(remoteFilesList, localFilesList);

		console.log('number of remoteFilesList count\n\t', remoteFilesList.length);
		console.log('number of localFilesList\n\t', localFilesList.length);
		console.log('number of filesToDelete\n\t', deletingFilesList.length);
		console.log('number of filesToAdd\n\t', _.difference(localFilesList, remoteFilesList).length);

		var existingFiles = self.getLocalFiles();
		var deletingFiles = self.getDeletingRemoteFiles(deletingFilesList);


		// console.log('existingFiles\n\t', existingFiles);
		// console.log('deletingFiles\n\t', deletingFiles);
		
		
		var files = existingFiles;
		if (deletingFiles.length !== 0) {
			files = _.extend(files, deletingFiles);
		}

		// console.log('files\n\t', files);
		var msg = {
			"id": gist.id,
			"description": gist.description,
			"files": files
			// "files": deletingFiles
			// "files": existingFiles
		};
		
		// console.log('MSG\n', msg);

		github.gists.edit(
			msg,
			function(err, res) {
				if (err) throw err;
				
				console.log('updateRemote callback');
				cb(err, res);
			}
		);
	};

	this.getRemoteLastUpdate = function (gist) {
		return gist.files[this.lastUpdateFile].content;
	};

	this.getGistFilesList = function (gist) {
		return _.map(gist.files, function(value, key) {
			return key;
		});
	};

	this.getDeletingRemoteFiles = function (filesLists) {
		var files = {};

		_.each(filesLists, function (element, index, list) {
			files[element] = null;
		});

		return files;
	};


	//===========================================//
	
	//
	// APPLICATION START
	//
	//
	
	this.set = function (prop, val) {
		var self = this;
		
		self[prop] = val;

		return self;
	};
	
	this.getUserSettingsFile = function () {
		var self = this;

		return self.userSettingsFile = self.settingsFolder + self.generalSettingsFile;
	};
	
	this.init = function () {
		var self = this;

		/*
		console.log(
			self.settingsFolder
		);
		*/
		var id = self.options('gistId');
		// console.log(id);

		if ( _.isPositiveInteger( id ) ) {
			// console.log('sunsync');
			self.runSync();
		} else {
			// console.log('findGistId');
			findGistId(self.runSync);
		}
		
		return self;
	};

	this.runSync = function () {
		var self = this;

		setInterval(function () {
			if (!self.syncIsGoing) {
				self.doSync();
			}
		}, ~~self.options('updateFrequency') );
	};

	this.doSync = function () {
		console.log('\n\t==================');
		var self = this;
		
		self.syncIsGoing = true;

		_.ghGetGistById(
			self.options('gistId'),
			function (res) {
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
							
							console.log('End of do sync. Fuck yeah!\n\n');
							self.syncIsGoing = false;
						});
					} else {
						console.log('LOCAL required sync');
						self.updateLocal(res, function (err, res) {
							console.log('local update successfull');
							
							console.log('End of do sync. Fuck yeah!\n\n');
							self.syncIsGoing = false;
						});
					}
				} else {
					console.log('All is already synced, congrats');
					console.log('End of do sync. Fuck yeah!\n\n');
					self.syncIsGoing = false;
				}

			}
		);
	};

	this.findGistId = function (cb) {
		var self = this;

		_.ghGetAllGists(self.username, ~~self.options('perPage'), null, function (res) {

			var validGist = _.find(
				res,
				function (gist) {
					if (gist) {
						return self.isValidSettings(gist);
					}
				}
			);

			if ((validGist) && _.isPositiveInteger(validGist.id)) {

				self.options('gistId', validGist.id);

				cb();

			} else {

				self.updateLocalLastUpdate();

				var msg = {
					"description": "optional desc: ",
					"public": true,
					'files': self.getLocalFiles()
				};

				_.ghCreateGist(msg, function (res) {
 					self.options('gistId', res.id);
					cb();
				});

			}

		});
	};

	this.isValidSettings = function (gist) {
		var self = this;
		var gistFiles = this.getGistFilesList(gist);
		var required = self.options('requiredFiles');

		// console.log(gistFiles);
		// console.log(required);
		var intersection = _.intersection(required, gistFiles);
		// console.log(intersection);

		// return (required.length === intersection.length);
		return _.isEqual(required, intersection);
	};

	//===========================================//
	
	//
	// OPTIONS START
	//

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
			case 0: return self.getOptions();
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
		var self = this;


		var general =  _.getJSON( _.readFile(self.generalSettingsFile) );
		var user    = _.getJSON( _.readFile( self.getUserSettingsFile() ) );
		
		// console.log('general', general);
		// console.log('user', user);

		var options = _.extend(general, user);

		// console.log('options', options);

		return options;
	};

	this.setOptions = function (settings) {
		var self = this;
		
		settings = JSON.stringify(settings);

		// console.log('settings', settings);

		_.writeFile(
			this.userSettingsFile,
			_.formatJSON(settings)
		);
	};


	return this;
};

module.exports = STsync;