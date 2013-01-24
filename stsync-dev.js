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
	ghIfGistExists : function (id, cb) {
		_.ghGetGist(id, function (err, res) {
			if (err) {
				if (err.code === 404) {
					cb(err, false);	
				} else {
					throw err;
				}
			} else {
				cb(err, true);
			}

		});
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


STsync = function () {

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

		// winston.info('password-based auth data:', authObject);

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

	this.runSync = function () {
		setInterval(function () {
			if (!self.syncIsGoing) {
				self.syncStep();
			} 
		}, ~~self.options('updateFrequency') );
	};

	this.syncStep = function () {
		var Locale = LocaleCopy();
		var Remote = RemoteCopy();

		if (Locale.timestamp < Remote.timestamp) {
			Locale.update()
		} else {
			Remote.update()
		}
	};



};


