// https://developer.mozilla.org/en-US/docs/JavaScript/Introduction_to_Object-Oriented_JavaScript
// STsync
var fs = require('fs'), // http://nodejs.org/docs/latest/api/fs.html
	_  = require('underscore'), // https://github.com/documentcloud/underscore
	moment = require('moment'), // https://github.com/timrwood/moment/

	
	GitHubApi = require('github'), // https://github.com/mikedeboer/node-github
	github = new GitHubApi( {version: '3.0.0'} ),

	
	winston = require('winston'); // https://github.com/flatiron/winston
	winston.add(
		winston.transports.File,
		{
			filename: './Data/Packages/STsync/logs/'+moment().format('LL')+'.txt',
			// filename: './logs/log.txt',
			maxFiles: 3,
			maxsize: 10000000 // 10M Bytes ~ 10k Kbytes ~ 10 Mbytes
			// handleExceptions: true
		}
	);
	// winston.remove(winston.transports.Console);

	// Log levels:
	//		log   → functions names, and callbacks for tracing
	//		info  → algorythm comments
	//		warn  → someting bad (not fatal) happens
	//		error → some error occurs

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
				cb(err, res);
			}
		);
	},
	ghCreateGist : function(msg, cb) {
		github.gists.create(
			msg,
			function(err, res) {
				cb(err, res);
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
				accumulator = _.union(res, accumulator);
				
				if (_.isEqual( res.length, perPage)) {
					// not last page
					_.ghGetAllGists(username, ++pageNumber, perPage, accumulator, cb);

				} else {
					// last page, return all accumulated gists
					cb(err, accumulator);
				}

			}
		);
	}
});

// winston.info();

STsync = function () {

	// this.settingsFolder = './settings/';
	this.lastUpdateFile = 'stsync.last-update';
	this.generalSettingsFile = './stsync.sublime-settings';

	this.syncIsGoing = false;

	//
	// OAUTH
	//
	
	this.auth = function () {
		winston.info('auth');
		var self = this;

		cb = _.last(arguments);

		args = _.initial(arguments);

		winston.info('auth arguments:', arguments);

		if (args.length == 1 && _.isObject( args[0]) ) {
			winston.info('selected OAUTH-based autharization');
			self.authByOAUTH(args[0], cb);
		}

		if (args.length == 2) {
			winston.info('selected password-based autharization');
			self.authByPassword(args[0], args[1], cb);
		}

		return self;
	};

	this.authByPassword = function (username, password, cb) {
		winston.info('authByPassword');
		var self = this;
		
		self.username = username;

		var authObject = {
			"type": "basic",
			"username": username,
			"password": password
		};

		winston.info('password-based auth data:', authObject);

		github.authenticate(authObject);

		cb();
	
		return self;
	};
	
	this.authByOAUTH = function (options, cb) {
		winston.info('authByOAUTH');
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
				// console.log(res);
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
		winston.info('updateLocal');
		winston.info('start update Local Copy');
		var self = this;

		var remoteFilesList = self.getGistFilesList(gist);
		var localFilesList = self.getLocalFilesList();

		winston.info('remoteFilesList', remoteFilesList);
		winston.info('localFilesList', localFilesList);

		// files from localFilesList that are not present in the remoteFilesList
		var deletingFilesList = _.difference(localFilesList, remoteFilesList);
		winston.info('deletingFilesList', deletingFilesList);
		
	
		_.each(deletingFilesList, function (element, index, list) {
			fs.unlinkSync(self.settingsFolder+element);
		});
		

		
		var lastUpdSec = gist.files[self.lastUpdateFile].content;

		winston.info('Remote Copy update time:', lastUpdSec);
		_.each(remoteFilesList, function (element, index, list) {

			var filePath = self.settingsFolder+element;
			_.writeFile(filePath, gist.files[element].content);
			
			_.updateMtime(filePath, _.unixSec2mtime(lastUpdSec));
			
		});

		_.updateMtime(self.settingsFolder, _.unixSec2mtime(lastUpdSec));

		cb();
	};

	this.getLocalLastUpdate = function () {
		winston.info('getLocalLastUpdate');
		var self = this;
		var file = self.settingsFolder+self.lastUpdateFile;
		
		winston.info('Local copy update file:', file);
		if (fs.existsSync(file)) {
			var lastUpdSec = _.readFile(file);
			winston.info('Remote Copy update time:', lastUpdSec);
			return lastUpdSec;
		} else {
			return 0;
		}
	};

	this.getLocalFilesList = function () {
		winston.info('getLocalFilesList');
		var files = fs.readdirSync(this.settingsFolder);
		winston.info('Local Copy files list:', files);
		return files;
	};

	this.getLocalFiles = function () {
		winston.info('getLocalFiles');
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

		winston.info('Local Copy files object:', files);
		return files;
	};

	this.updateLocalLastUpdate = function () {
		winston.info('updateLocalLastUpdate');
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
		
		winston.info('List of local files’s mtimes:', filesMtime);

		var folderMtime = _.mtime2unixSec(
			fs.statSync(self.settingsFolder).mtime
		);
		winston.info('Local folder’s mtime:', folderMtime);


		filesMtime.push(folderMtime);

		var mtimes = filesMtime;
		winston.info('Local folder’s mtime plus files’ mtimes:', mtimes);

		var lastUpdateNew = _.max(mtimes);
		winston.info('Local Copy update time:', lastUpdateNew);


		if (
			parseInt(lastUpdateNew, 10) !== parseInt(self.getLocalLastUpdate(), 10)
		) {
			winston.info('Local files was changed and need to be synced (uploaded)');
			_.writeFile(
				self.settingsFolder+self.lastUpdateFile,
				lastUpdateNew
			);
		} else {
			winston.info('No one file has not been changed');
		}
	};

	//===========================================//

	//
	// REMOTE
	//

	this.updateRemote = function (gist, cb) {
		winston.info('updateRemote');
		winston.info('start update Remote Copy');
		var self = this;

		var remoteFilesList = self.getGistFilesList(gist);
		var localFilesList = self.getLocalFilesList();

		winston.info('remoteFilesList', remoteFilesList);
		winston.info('localFilesList', localFilesList);

		var deletingFilesList = _.difference(remoteFilesList, localFilesList);
		winston.info('deletingFilesList', deletingFilesList);

		winston.info('number of remoteFilesList count\n\t', remoteFilesList.length);
		winston.info('number of localFilesList\n\t', localFilesList.length);
		winston.info('number of filesToDelete\n\t', deletingFilesList.length);
		winston.info('number of filesToAdd\n\t', _.difference(localFilesList, remoteFilesList).length);

		var existingFiles = self.getLocalFiles();
		var deletingFiles = self.getDeletingRemoteFiles(deletingFilesList);


		winston.info('existingFiles\n\t', existingFiles);
		winston.info('deletingFiles\n\t', deletingFiles);
		
		
		var files = existingFiles;
		if (deletingFiles.length !== 0) {
			files = _.extend(files, deletingFiles);
		}

		var msg = {
			"id": gist.id,
			"description": gist.description,
			"files": files
		};
		
		winston.info('GITHUB EDIT MSG', msg);

		github.gists.edit(
			msg,
			function(err, res) {
				if (err) throw err;
				
				cb(err, res);
			}
		);
	};

	this.getRemoteLastUpdate = function (gist) {
		winston.info('getRemoteLastUpdate');
		var time = gist.files[this.lastUpdateFile].content;
		winston.info('Remote last update', time);
		return time;
	};

	this.getGistFilesList = function (gist) {
		winston.info('getGistFilesList');
		var filesList = _.map(gist.files, function(value, key) {
			return key;
		});
		winston.info('Remote Files list', filesList);
		return filesList;
	};

	this.getDeletingRemoteFiles = function (filesLists) {
		winston.info('getDeletingRemoteFiles');
		winston.info('Generate JSON for files needs to be deleted');
		var files = {};

		_.each(filesLists, function (element, index, list) {
			files[element] = null;
		});
		
		winston.info('Files needs to be deleted', files);
		return files;
	};


	//===========================================//
	
	//
	// APPLICATION START
	//
	//
	
	this.set = function (prop, val) {
		winston.info('set');
		winston.info('Set app cofiguration', prop, val);
		
		var self = this;
		
		self[prop] = val;

		return self;
	};
	
	this.getUserSettingsFile = function () {
		winston.info('getUserSettingsFile');
		var self = this;
		self.userSettingsFile = self.settingsFolder + self.generalSettingsFile;
		
		winston.info('User settings file:', self.userSettingsFile);
		return self.userSettingsFile;
	};
	
	this.init = function () {
		winston.info('init');
		winston.info('Initialization app');
		var self = this;

		winston.info('Settings folder', self.settingsFolder);

		var id = self.options('gistId');
		
		winston.info('Gist id:', id);

		if ( _.isPositiveInteger( id ) ) {
			winston.info('GistId exists and positive integer');
			self.runSync();
		} else {
			winston.info('GistId not valid');
			findGistId(self.runSync);
		}
		
		return self;
	};

	this.runSync = function () {
		winston.info('runSync');
		winston.info('Start syncronization step in a loop');

		var self = this;

		var steSize = ~~self.options('updateFrequency');
		
		winston.info('Syncronization step size: '+stepSize+'ms.');


		setInterval(function () {
			winston.info('Loop step starts');
			if (!self.syncIsGoing) {
				winston.info('Another step is not going now, so continue');
				self.doSync();
			} else {
				winston.info('Another step is going, exit this step');
			}
		}, stepSize );
	};

	this.doSync = function () {
		winston.info('doSync');
		winston.info('Start sync step');

		var self = this;
		
		self.syncIsGoing = true;

		winston.info('set syncIsGoing flag:', self.syncIsGoing);

		var gistId = self.options('gistId');
		winston.info('settings’ gistId', gistId);
		_.ghGetGistById(
			gistId,
			function (err, res) {
				if (err) throw err;
				// @TODO: handle the error when gistId exists in settings file,
				// but gist by this id has been deleted from the server
				self.updateLocalLastUpdate();
				
				var localUpdate = self.getLocalLastUpdate();
				var remoteUpdate = self.getRemoteLastUpdate(res);

				winston.info('localUpdate', localUpdate);
				winston.info('remoteUpdate', remoteUpdate);


				if (localUpdate != remoteUpdate) {
					winston.info('Sync required, ’cause of timestamps are not identical');
					winston.info('Timestamps delta (local-remote): ', localUpdate - remoteUpdate);

					if (localUpdate > remoteUpdate) {
						winston.info('Sync direction: LOCAL → REMOTE');

						self.updateRemote(res, function (err, res) {
							winston.info('Remote update successfull');
							
							winston.info('End of sync step.');
							self.syncIsGoing = false;
						});
					} else {
						winston.info('Sync direction: REMOTE → LOCAL');

						self.updateLocal(res, function (err, res) {
							winston.info('Local update successfull');
							
							winston.info('End of sync step.');
							self.syncIsGoing = false;
						});
					}
				} else {
					winston.info('Two Copies are synced between itself');
					winston.info('End of sync step.');
					self.syncIsGoing = false;
				}

			}
		);
	};

	this.findGistId = function (cb) {
		winston.info('findGistId');
		winston.info('Find Gist from all gists from server');

		var self = this;

		_.ghGetAllGists(self.username, 1, ~~self.options('perPage'), null,
			function (err, res) {

				if (err) throw err;

				var validGist = _.find(
					res,
					function (gist) {
						if (gist) {
							return self.isValidSettings(gist);
						}
					}
				);

				winston.info('Gist with valid list of files:', validGist);

				if ((validGist) && _.isPositiveInteger(validGist.id)) {
					winston.info('Gist was found on the server');
					

					self.options('gistId', validGist.id);

					cb();

				} else {
					winston.info('There is no gist on the server');
					winston.info('Let’s create gist');

					self.updateLocalLastUpdate();

					var msg = {
						"description": "optional desc: ",
						"public": true,
						'files': self.getLocalFiles()
					};
					
					winston.info('Create gist MSG object', msg);

					_.ghCreateGist(msg, function (err, res) {
						if (err) throw err;

	 					self.options('gistId', res.id);
						cb();
					});

				}

			}
		);
	};

	this.isValidSettings = function (gist) {
		winston.info('isValidSettings');

		var self = this;
		var gistFiles = this.getGistFilesList(gist);
		var required = self.options('requiredFiles');

		winston.info('gistFiles', gistFiles);
		winston.info('required', required);
		var intersection = _.intersection(required, gistFiles);
		
		winston.info('intersection', intersection);

		var res = _.isEqual(required, intersection);
		winston.info('Is settings valid:', res);

		return res;
	};

	//===========================================//
	
	//
	// OPTIONS START
	//

	this.options = function () {
		winston.info('options');
		var self = this;

		winston.info('options arguments', arguments);

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
		winston.info('getOptions');
		var self = this;


		var general =  _.getJSON( _.readFile(self.generalSettingsFile) );
		var user    = _.getJSON( _.readFile( self.getUserSettingsFile() ) );
		
		winston.info('general settings: ', general);
		winston.info('user settings: ', user);

		var options = _.extend(general, user);

		winston.info('options', options);

		return options;
	};

	this.setOptions = function (settings) {
		winston.info('setOptions');
		var self = this;
		
		settings = JSON.stringify(settings);

		winston.info('settings', settings);

		_.writeFile(
			this.userSettingsFile,
			_.formatJSON(settings)
		);
	};


	return this;
};

module.exports = STsync;