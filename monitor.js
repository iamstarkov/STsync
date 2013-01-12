var fs = require('fs');
var moment = require('moment');
var _ = require('underscore');

var path = './settings/';

(function checkForMtime() {
	// console.log('');
	// console.log('--------------------------');
	// console.log('1');
	var asd = _.max(
		_.map(

			fs.readdirSync(path),

			function (file, index, list) {
				return moment(
					fs.statSync(path+file).mtime
				).unix();
				
			}

		)
	);

	console.log(asd);

	/*
	fs.stat('./settings/.', function(err, stats) {
		console.log(stats.mtime);
	});
	fs.stat('./settings/', function(err, stats) {
		console.log(stats.mtime);
	});
	 */
	
	setTimeout(checkForMtime, 100);
})();