var GitHubApi = require('github');
var _ = require('underscore');
var fs = require('fs');

var github = new GitHubApi({
	version: '3.0.0'
});

github.authenticate({
	type: 'basic',
	username: process.argv[2],
	password: process.argv[3]
});

var gistId = process.argv[4];

github.gists.get(
	{
		id: gistId
	},
	function (err, res) {
		if (!err) {
			// console.log(res.length);
			// console.log(res.files);
			fs.mkdir('./import/' + gistId, function() {
				_.each(res.files, function (element, index, list) {
					// console.log(element.filename, element.content);
					fs.writeFile(
						'./import/'+gistId + '/' + element.filename,
						element.content,
						function(err) {
							if(err) {
								console.log(err);
							} else {
								console.log(element.filename + ' was saved!');
							}
						}
					);
				});
			});
		} else {
			console.log(err);
		}
	}
);