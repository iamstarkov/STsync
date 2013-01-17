var sync     = require('./stsync.js'),
	username = process.argv[2],
	password = process.argv[3],
	folder   = process.argv[4];

sync(username, password, folder);

//
// Imitating situation, like you have two opened text editors
// on two different machine: **localCopy1** and **localCopy2**.
//
// **LocalCopy1** initially has default ST2 configuration (with STsync
// cofiguration files needed for synchronization)
//
// **LocalCopy2** initially empty.
//
// After running, script will firstly initialize itself in fist Copy,
// create gist with it’s contents in your gists archive, and then it will
// run the permanent synchronization.
// After 5 seconds, script will initialize itself, it will find valid copy
// of configuration in gists and will use it, the it will run the permanent
// synchronization.
//
// Now **LocalCopy1** and **LocalCopy2** is linked with each other. Try to
// add, edit or remove (exceptions(!)) files. Changes would be applied in
// two way smoothly.
//
// Required for synchronization files (do not remove these files):
//		"Default (Linux).sublime-keymap",
//		"Default (OSX).sublime-keymap",
//		"Default (Windows).sublime-keymap",
//		"Preferences.sublime-settings",
//		"stsync.sublime-settings",
//		"stsync.last-sync"
//


