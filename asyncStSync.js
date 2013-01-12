init(runSync(err, res));

function init(cb) {	
	getSettings (cb);
}


function getSettings (cb) {
	var settings = fs.readFileSync(this.path+this.file, 'utf-8');
	
	if (isValidGistId()) {
		if (_.isFunction(cb)) { cb(settings); }
	} else {
		getGistId(settings, cb);
	}

}

function runSync(settings) {
	doSync(settings, function() {
		setTimeout(doSync(settings), settings.updateFrequency);
	});
}

function doSync (settings) {
	// simple atomic operation
}

function getGistId (settings, cb) {
	getAllGists(settings, function (err, res) {
		var gistId = _.find(res, isValidSettings(gist)).gistId;

		if (isValidGistId(gistId)) {

			settings.gistId = gistId;
			if (_.isFunction(cb)) { cb(settings); }

		} else {
			createGist(settings, function (err, res) {

				settings.gistId = res.gistId;
				if (_.isFunction(cb)) { cb(settings); }

			});
		}

	});
}

function getAllGists (settings, cb, pageNumber, gistsAccumulator) {
	if (_.isUndefined(pageNumber)) { pageNumber = 1; }

	
	github.gists.getFromUser(
		{
			'user': 'login',
			'page': pageNumber,
			'per_page': settings.perPage
		},
		function (err, res) {
			gistsAccumulator = _.union(res, gistsAccumulator);
			
			if (_.isEqual( res.length, settings.perPage)) {
				// not last page
				getAllGists(settings, cb, pageNumber++, gistsAccumulator);
			} else {
				// last page, return all accumulated gists
				if (_.isFunction(cb)) { cb(err, gistsAccumulator); }
			}

		}
	);
	
}

function createGist (settings, cb) {
	
	github.gists.create(
		{
			'description': 'optional desc: ' + new Date(),
			'public': true,
			'files': {}
		},
		function(err, res) {
			if (_.isFunction(cb)) { cb(err, res); }
		}
	);
	
}

function isValidSettings (gistFiles) {
	gistFiles = _.map(gistFiles, function (value, key, list) {
		return key;
	});
	return (required == _.intersection(required, gistFiles));
}

function isValidGistId (id) {
	return (_.isNumber(gistId) && !_.isNaN(gistId));
}