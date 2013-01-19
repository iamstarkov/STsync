var _           = require('underscore'),
	fs          = require('fs'),
	defaultCopy = './demo/DefaultCopy/',
	LocalCopy1  = './demo/LocalCopy1/',
	LocalCopy2  = './demo/LocalCopy2/';

// removing all files from LocalCopy1
_.each(
	fs.readdirSync(LocalCopy1),
	function (element, index, list) {
		fs.unlinkSync(LocalCopy1+element);
	}
);

// removing all files from LocalCopy2
_.each(
	fs.readdirSync(LocalCopy2),
	function (element, index, list) {
		fs.unlinkSync(LocalCopy2+element);
	}
);

// removing default files to local copies
_.each(
	fs.readdirSync(defaultCopy),
	function (element, index, list) {
		cp(defaultCopy+element, LocalCopy1+element);
		cp(defaultCopy+element, LocalCopy2+element);
	}
);


function cp (from, to) {
	var readStream = fs.createReadStream(from);
    readStream.pipe(fs.createWriteStream(to));
}