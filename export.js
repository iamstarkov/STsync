var GitHubApi = require('github');
var _ = require('underscore');
var fs = require('fs');

var github = new GitHubApi({
	version: '3.0.0'
});

github.authenticate({
	type: "basic",
	username: process.argv[2],
	password: process.argv[3]
});

var folder = (_.isUndefined(process.argv[4])) ?
	'./export/'
	: process.argv[4];
	
var filesInFolder = fs.readdirSync(folder);
var files = {};

_.each(filesInFolder, function (element, index, list) {
	files[element] = {
		'content': fs.readFileSync('./' + folder + '/' + element, 'utf-8')
	};
});

var msg = {
	'description': 'optional desc: ' + new Date(),
	'public': true,
	'files': files
};

// console.log(msg);

github.gists.create(
	msg,
	function(err, res) {
		if (!err) {
			console.log('Gist id: ' + res.id);
			console.log('Gist link: ', res.html_url);
		} else {
			console.log(err);
		}
	}
);
