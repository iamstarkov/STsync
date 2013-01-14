// Web application which authenticates to github
var http = require('http'),
	url = require('url'),
	qs = require('querystring'),
	github = require('octonode'),
	open = require('open');

// Build the authorization config and url
var auth_url = github.auth.config({
	id: '5f4f0546d36a62e59428',
	secret: 'mygithubclientsecret'
}).login(['user', 'repo', 'gist']);

// Web server
http.createServer(function (req, res) {
	uri = url.parse(req.url);
	// Redirect to github login
	console.log('uri', uri);
	if (uri.pathname=='/login') {
		res.writeHead(301, {'Content-Type': 'text/plain', 'Location': auth_url});
		res.end('Redirecting to ' + auth_url);
	}
	// Callback url from github login
	else if (uri.pathname=='/') {
		
		github.auth.login(qs.parse(uri.query).code, function (err, token) {
			console.log(token);
		});

		res.writeHead(200, {'Content-Type': 'text/plain'});
		res.end('');
	} else {
		res.writeHead(200, {'Content-Type': 'text/plain'});
		res.end('');
	}
}).listen(3000);

open('http://localhost:3000/login');

console.log('Server started on 3000');


