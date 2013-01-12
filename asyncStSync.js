init(runSync(err, res));

function init(cb) {	
	getSettings (cb);
}

// TODO: сделать ассинхронное чтение
function getSettings (cb) {
	var settings = fs.readFileSync(this.path+this.file, 'utf-8');
	
	if (isValidGistId()) {
		if (_.isFunction(cb)) { cb(settings); }
	} else {
		getGistId(settings, cb);
	}

}

// WTF?!
function runSync(settings) {
	doSync(settings, function() {
		setTimeout(doSync(settings), settings.updateFrequency);
	});
}

// ты не должен хотеть этого
function doSync (settings) {
	// simple atomic operation
}

function getGistId (settings, cb) {
	getAllGists(settings, function (err, res) {
		var gistId = _.find(res, isValidSettings(gist)).gistId;

		if (isValidGistId(gistId)) {

			settings.gistId = gistId;
			// если вдруг колбек не будет передан, то с точки зрения пользователя
			// этого асинхронного метода он НИКОГДА не завершится.
			// по этому нужно выбрасывать исключения, чтобы весь скрипт падал
			if (_.isFunction(cb)) { cb(settings); }

		} else {
			createGist(settings, function (err, res) {

				settings.gistId = res.gistId;
				if (_.isFunction(cb)) { cb(settings); }

			});
		}

	});
}

// колбек ВСЕГДА идет поледним параметром. без исключений!
// смотри исходники nodejs на предмет того, как они обрабатывают необязательные параметры
// NOTE: что такое gistsAccumulator?
// название метода не соответствует тому, что он делает.
// ты смешал в кучу вытягивание одной страницы и перебор страниц.
// а можно страницы вытягивать параллельно?
function getAllGists (settings, pageNumber, gistsAccumulator, cb) {
	// TODO: переписать условие в этом ифе. pageNumber может быть определен,
	// но не являться допустимым числом, например
	if (_.isUndefined(pageNumber)) { pageNumber = 1; }

	github.gists.getFromUser(
		{
			'user': 'login',
			'page': pageNumber,
			'per_page': settings.perPage
		},
		function (err, res) {
			gistsAccumulator = _.union(res, gistsAccumulator);
			
			// NOTE: а на последней старнице может быть perPage элементов?
			// Например, 20 элементов, 10 на странице => итого 2 страницы с одинаковым количеством элементов
			if (_.isEqual( res.length, settings.perPage)) {
				// not last page
				getAllGists(settings, pageNumber++, gistsAccumulator, cb);
			} else {
				// last page, return all accumulated gists
				// а что это за err? ошибка последней старницы?
				// может она была на 4-ой, а на 10 (последней) ошибки не было.
				// была ли ошибка вообще в этом случае?
				cb(err, gistsAccumulator);
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
		// не нужно делать ни каких проверок
		// если колбек не передали, то это фатальная ошибка и надо выбрасывать исключение
		cb
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
