var GitHubApi = require('github');
var _         = require('underscore');

var github = new GitHubApi({
    version: '3.0.0'
});


/*
github.user.getFollowingFromUser({
    user: 'login'
}, function(err, res) {
    // console.log(JSON.stringify(res));
    console.log(JSON.stringify(res));
});
*/

/*
github.authenticate({
    type: "basic",
    username: 'login',
    password: 'pswd'
});
 */

var gistId;

/*
github.gists.create(
	{
		'description': 'test gist #2',
		'public': true,
		'files': {
			'file1.txt': {
				'content': 'String file contents'
			}
		}
	},
	function(err, res) {
		if (!err) {
			console.log(res.id);
			gistId = res.id;
		} else {
			console.log(err);
		}
	}
);
*/

/*

// редактирование ведёт себя, адекватно как и ожидается
github.gists.create(
	{
		'description': 'test gist #2',
		'public': true,
		'files': {
			'file1.txt': {
				'content': 'String file contents'
			}
		}
	},
	function(err, res) {
		if (!err) {
			console.log(res.id);
			gistId = res.id;

			github.gists.edit(
				{
					'id': gistId,
					'description': 'test gist #2 edited desc',
					'files': {
						'file1.txt': {
							'content': 'Modified String file contents'
						}
					}
				},
				function(err, res) {
					if (!err) {
						console.log(res.id);
						gistID = res.id;
					} else {
						console.log(err);
					}
				}
			);

		} else {
			console.log(err);
		}
	}

);
 */


// asd

/*
	
	работает как и нужно

		'files': {
			'file1.txt': {
				'content': 'Modified String file contents'
			}
		}

		———>>>

		'files': {
			'file1.txt': {
				'content': 'Modified String file contents'
			},
			'file2.md': {
				'content': 'Markdown added file'
			}
		}

*/

gistId = 4469362;

/*
не удаляет файл, для этого нужно null отправлять
		'files': {
			'file1.txt': {
				'content': 'Modified String file contents'
			},
			'file2.md': {
				'content': 'Markdown added file'
			}
		}
			
		———>>>

		'files': {
			'file2.md': {
				'content': 'Markdown added file'
			}
		}
*/

/*
github.gists.edit(
	{
		'id': gistId,
		'description': 'test gist #2 added one file',
		'files': {
			'file1.txt': null,
			'file2.md': {
				'content': 'Markdown added file'
			}
		}
	},
	function(err, res) {
		if (!err) {
			console.log(res.id);
			gistID = res.id;
		} else {
			console.log(err);
		}
	}
);
*/

// github.gists.public(
// github.gists.getAll(



github.gists.getFromUser(
	{
		'user': 'login',
		'page': 1,
		'per_page': 100
	},
	function(err, res) {
		if (!err) {
			// console\.log(res.length);

			_.each(res, function (element, index, list) {
				// console.log(element.id, element.description);
				console.log(element.description);
			});

			github.gists.getFromUser(
				{
					'user': 'login',
					'page': 2,
					'per_page': 100
				},
				function(err, res) {
					if (!err) {
						// console.log(res.length);
						
						_.each(res, function (element, index, list) {
							// console.log(element.id, element.description);
							console.log(element.description);
						});
						
					} else {
						console.log(err);
					}
				}
			);

		} else {
			console.log(err);
		}
	}
);