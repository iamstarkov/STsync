var express = require('express'),
	passport = require('passport'),
	util = require('util'),
	forceOpen = require('open'),
	GitHubStrategy = require('passport-github').Strategy;

var GITHUB_CLIENT_ID = "5f4f0546d36a62e59428";
var GITHUB_CLIENT_SECRET = "90abc81d07fd055bb9a44fc018ef5b8bbe70c459";


passport.serializeUser(function(user, done) {
	done(null, user);
});

passport.deserializeUser(function(obj, done) {
	done(null, obj);
});


passport.use(new GitHubStrategy(
	{
		clientID: GITHUB_CLIENT_ID,
		clientSecret: GITHUB_CLIENT_SECRET,
		callbackURL: "http://localhost:2121/auth/github/callback"
	},
	function(accessToken, refreshToken, profile, done) {
		
		console.log('----------------------');
		console.log(arguments);
		console.log('----------------------');

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
	app.use(express.logger());
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

app.listen(2121);

forceOpen('http://localhost:2121/');

function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) { return next(); }
	res.redirect('/login');
}
