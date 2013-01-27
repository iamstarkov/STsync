// STsync
var fs = require('fs'), // http://nodejs.org/docs/latest/api/fs.html
	_  = require('underscore'), // https://github.com/documentcloud/underscore
	moment = require('moment'), // https://github.com/timrwood/moment/

	
	GitHubApi = require('github'), // https://github.com/mikedeboer/node-github
	github = new GitHubApi( {version: '3.0.0'} ),

	
	winston = require('winston'); // https://github.com/flatiron/winston
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
	timezone2utc : function(timezoneTimestamp) {
		var offsetInMin = new Date().getTimezoneOffset();
		var utcTimestamp = timezoneTimestamp + offsetInMin*60;
		return utcTimestamp;
	},
	utc2timezone : function(utcTimestamp) {
		// https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/parse
		var offsetInMin = new Date().getTimezoneOffset();
		var timezoneTimestamp = utcTimestamp - offsetInMin*60;

		return timezoneTimestamp;
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
	readFile : function (file) {
		return fs.readFileSync(file, 'utf-8');
	},
	writeFile : function (file, content) {
		fs.writeFileSync(file, content, 'utf-8');
	},
	removeFile : function (file) {
		fs.unlinkSync(file);
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
	isPositiveInteger : function (number) {
		number = parseInt(number, 10);
		return (_.isNumber(number) && !_.isNaN(number));
	},
	ghGetGist : function (id, cb) {
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


STsync = function (relative) {
	var self = this;

	self.relativePath        = relative+'/';

	self.relativePluginPath  = self.relativePath + 'STsync/';
	self.relativeUserPath    = self.relativePath + 'UserFake/';
	self.settingsFile        = 'stsync.sublime-settings';
	self.userSettingsFile    = self.relativeUserPath + self.settingsFile;
	self.generalSettingsFile = self.relativePluginPath + self.settingsFile;
	self.lastUpdateFile      = 'stsync.last-update';

	self.syncIsGoing = false;

	// self.relativePluginPath+'logs/'+moment().format('LL')+'.txt',
	// C:
	winston.add(
		winston.transports.File,
		{
			// filename: self.relativePluginPath+'logs/'+moment().format('LL')+'.txt',
			filename: self.relativePluginPath+'logs/log.txt',
			// filename: './logs/log.txt',
			maxFiles: 3,
			maxsize: 10000000 // 10M Bytes ~ 10k Kbytes ~ 10 Mbytes
			// handleExceptions: true
		}
	);


	//===========================================//

	//
	// OAUTH
	//
	
	self.auth = function () {
		winston.info('auth');
		cb = _.last(arguments);

		args = _.initial(arguments);

		if ( args.length === 1 && _.isObject(args[0]) ) {
			self.authByOAUTH(args[0], cb);
		}

		if ( args.length === 2 ) {
			self.authByPassword(args[0], args[1], cb);
		}

		return self;
	};

	self.authByPassword = function (username, password, cb) {
		self.username = username;

		var authObject = {
			"type": "basic",
			"username": username,
			"password": password
		};

		github.authenticate(authObject);

		cb();
	
		return self;
	};
	
	self.authByOAUTH = function (options, cb) {


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
				
				// app.close();
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
				
				// server.close();
			}
		);

		app.get('/logout', function(req, res){
			req.logout();
			res.redirect('/');
		});

		var server = app.listen(options.port);
		forceOpen('http://'+options.host+':'+options.port+'/auth/github');


		function ensureAuthenticated(req, res, next) {
			if (req.isAuthenticated()) { return next(); }
			res.redirect('/login');
		}
		
		return self;
	};

	//===========================================//
	
	//
	// OPTIONS START
	//

	self.options = function () {
		
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
	
	self.getOptions = function () {

		var general =  _.getJSON( _.readFile(self.generalSettingsFile) );
		var user    = _.getJSON( _.readFile( self.userSettingsFile ) );
		var options = _.extend(general, user);

		return options;
	};

	self.setOptions = function (settings) {
		settings = JSON.stringify(settings);
		_.writeFile( this.userSettingsFile, _.formatJSON(settings) );
	};

	//===========================================//

	//
	// LOCAL
	//

	self.LocalUpdate = function (gist, cb) {
		winston.info('LocalUpdate');


		var remoteFilesList = self.RemoteGetFilesList(gist);
		var localFilesList  = self.LocalGetFilesList();

		var deletingFilesList = _.difference(localFilesList, remoteFilesList);
	
		_.each(deletingFilesList, function (element, index, list) {
			_.removeFile(this.relativeUserPath+element);
		});
		
		var timestamp = self.RemoteGetTimestamp(gist);


		timezoneTimestamp = _.utc2timezone(timestamp);

		_.each(remoteFilesList, function (element, index, list) {

			var filePath = this.relativeUserPath+element;
			_.writeFile(filePath, _.unescapeQuotes(gist.files[element].content) );
			
			_.updateMtime(filePath, _.unixSec2mtime(timezoneTimestamp));
			
		});

		_.updateMtime(this.relativeUserPath, _.unixSec2mtime(timezoneTimestamp));

		cb();
	};

	self.LocalGetTimestamp = function () {
		var file = this.relativeUserPath+self.lastUpdateFile;
		
		if (fs.existsSync(file)) {
			var lastUpdSec = _.readFile(file);
			return lastUpdSec;
		} else {
			return 0;
		}
	};

	self.LocalGetFilesList = function () {
		var files = fs.readdirSync(this.relativeUserPath);
		return files;
	};

	self.LocalGetFiles = function () {
		var files = {};

		_.each(
			self.LocalGetFilesList(),
			function (element, index, list) {
				var fileContent = _.readFile(self.relativeUserPath + element);

				if (fileContent !== '') {
					files[element] = {
						"content": _.escapeQuotes(fileContent)
					};
				}
			}
		);

		return files;
	};

	self.LocalUpdateTimestamp = function () {
		// папка с файлами
		//		список локальных таймстемпов
		//		локальный таймстемп для папки
		//		нахожу максимальный
		//		перевожу максимум в utc таймстемп
		//		сравниваю с таймстемпом из файла
		//		если больше, то обновляю файл новым таймстемпом
		var filesMtime = _.compact(
			_.map(
				fs.readdirSync(self.relativeUserPath),
				function (file, index, list) {
					var mtime, mtime_unix;
					if (file != self.lastUpdateFile) {
						mtime = fs.statSync(self.relativeUserPath + file).mtime;

						return _.mtime2unixSec(mtime);
					}
				}
			)
		);
		
		var folderMtime = _.mtime2unixSec(
			fs.statSync(self.relativeUserPath).mtime
		);

		filesMtime.push(folderMtime);

		var mtimes = filesMtime;

		var maxTimestamp = _.max(mtimes);

		var utcMaxTimestamp = _.timezone2utc(maxTimestamp);

		if (
			parseInt(utcMaxTimestamp, 10) !== parseInt(self.LocalGetTimestamp(), 10)
		) {
			_.writeFile(
				self.relativeUserPath+self.lastUpdateFile,
				utcMaxTimestamp
			);
		}
	};
	
	//===========================================//

	//
	// REMOTE
	//

	self.RemoteUpdate = function (gist, cb) {
		winston.info('RemoteUpdate');

		var remoteFilesList = self.RemoteGetFilesList(gist);
		var localFilesList = self.LocalGetFilesList();


		var deletingFilesList = _.difference(remoteFilesList, localFilesList);

		var existingFiles = self.LocalGetFiles();
		var deletingFiles = self.RemoteGetDeletingFiles(deletingFilesList);


		
		var files = existingFiles;
		if (deletingFiles.length !== 0) {
			files = _.extend(files, deletingFiles);
		}

		var msg = {
			"id": gist.id,
			"description": gist.description,
			"files": files
		};
		
		github.gists.edit(msg, function(err, res) {
			if (err) throw err;
			
			cb(err, res);
		});
	};

	self.RemoteGetTimestamp = function (gist) {
		return gist.files[this.lastUpdateFile].content;
	};

	self.RemoteGetFilesList = function (gist) {
		var filesList = _.map(gist.files, function(value, key) {
			return key;
		});
		return filesList;
	};

	self.RemoteGetDeletingFiles = function (filesLists) {
		var files = {};

		_.each(filesLists, function (element, index, list) {
			files[element] = null;
		});
		
		return files;
	};

	self.RemoteGet = function (cb) {
		winston.info('RemoteGet');
		// check gist id from options
		// if it exists
		//		download linked gist
		//			if !error
		//				return gist to callback
		//			else
		//				if error = 404
		//					create one
		//					save it to options
		//					return gist to callback
		//				else
		//					throw
		// else
		//		start search on server
		//			if successfully found
		//				save it to options
		//				return gist to callback
		//			else
		//				create one
		//				save it to options
		//				return gist to callback
		//
		
		var id = self.options('gistId');

		if (_.isPositiveInteger(id)) {
			winston.info('Gist#' + id + ' EXISTS in settings file');
			
			_.ghGetGist(id, function (err, res) {
				// console.log(err); // need to found 404
				if (!err) {
					winston.info('gist#'+id+' is AVAILABLE on server');
					// return gist to callback
					cb(res);
				} else {
					if (err.code === 404) {
						winston.info('gist#'+id+' is NOT AVAILABLE on server');
						self.RemoteInit(cb);
					}
				}
			});

		} else {
			// if gist id NOT EXISTS
			winston.info('There is no gist.id in settings file');

			self.getAllGists(function(res) {
				var gist = self.findValidRemote(res);

				if (!_.isUndefined(gist))  {
					// if successfully found
					winston.info('Valid Remote copy is AVAILABLE on server');

					// save it to options
					self.options('gistId', gist.id);

					// return gist to callback
					cb(gist);
				
				} else {
					// create new one
					winston.info('Valid Remote copy is NOT AVAILABLE on server');

					self.RemoteInit(cb);
				}

			});
		}
	};

	self.RemoteInit = function (cb) {
		winston.info('RemoteInit');

		self.LocalUpdateTimestamp();
		var msg = {
			"public": true,
			"description": 'optional desc',
			"files": self.LocalGetFiles()
		};
		
		github.gists.create(msg, function(err, gist) {
			if (err) throw err;

			self.options('gistId', gist.id);

			winston.info('Need to update new Remote with it’s ID');
			self.RemoteUpdate(gist, function (err, res) {
				cb(res);
			});

		});
	};

	self.getAllGists = function (cb) {
		_.ghGetAllGists(
			self.username,
			1,
			~~self.options('perPage'),
			null,
			
			function (err, res) {
				if (err) throw err;
				cb(res);
			}
		);
	};

	self.findValidRemote = function (res) {
		var validGist = _.find(res,	function (gist) {
			if (gist) {
				return self.isRemoteValid(gist);
			}
		});

		return validGist;
	};

	self.isRemoteValid = function (gist) {
		var gistFiles = self.RemoteGetFilesList(gist);
		var required = self.options('requiredFiles');
		var intersection = _.intersection(required, gistFiles);
		
		var res = _.isEqual(required, intersection);
		return res;
	};

	//===========================================//

	self.runSync = function () {
		winston.info('runSync');
		setInterval(function () {
			if (!self.syncIsGoing) {
				self.syncStep();
			}
		}, ~~self.options('updateFrequency') );
	};

	self.syncStep = function () {
		console.log('\n\n');
		winston.info('syncStep');
		self.syncIsGoing = true;

		self.LocalUpdateTimestamp();
		// Condition synchronization: both copies are available for access
		self.RemoteGet(function (gist) {
			winston.info('syncStep: remoteGet callback');

			var delta = self.LocalGetTimestamp() - self.RemoteGetTimestamp(gist);

			winston.info('Sync delta: ' + delta + 'sec');
			if (delta !== 0) {
				if (delta < 0) {
					self.LocalUpdate(gist, function (err, res) {
						self.syncIsGoing = false;
						winston.info('Successfull sync');
					});
				}  else {
					self.RemoteUpdate(gist, function (err, res) {
						self.syncIsGoing = false;
						winston.info('Successfull sync');
					});
				}
			} else {
				self.syncIsGoing = false;
				winston.info('Nothing to do here');
			}
		
		});
	};

	process.on('uncaughtException', function(err) {
		winston.error(err.stack);
		process.exit();
	});

	return this;
};


module.exports = STsync;