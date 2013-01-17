# STsync #

Sublime Text plugin for syncronising configuration. Read more in my userecho [suggestion][1].

### Current state: in active development ###


## Changelog: ##

* 0.0.8 *(17 jan 2012)* — Synchronization worked
* 0.0.7 *(16 jan 2012)* — Synchronization demo added
* 0.0.6 *(16 jan 2012)* — Update local functionality
* 0.0.5 *(16 jan 2012)* — Update remote functionality added
* 0.0.4 *(15 jan 2012)* — Local and remote copy added
* 0.0.3 *(15 jan 2012)* — Synchronization step added
* 0.0.2 *(15 jan 2012)* — Initializing finished
* 0.0.1 *(09 jan 2012)* — Testing import/export functionality


## Roadmap ##

* 0.0.9 — Refactoring start
* 0.0.10 — Refactoring: added normal logger ([winston][2]
* 0.0.11 — Refactoring: polimorhism for CopyLocal and CopyRemote
* 0.0.12 — Refactoring: chaining
* 0.0.13 — Refactoring end
* 0.0.14 — Documentation writed and compiled
* 0.0.15 — Tests writed
* 0.0.16 — Tests successfully passing
* 0.0.17 — Created OAUTH authorization via web interface
* 0.1.0 — Created python wrapper sketch…
* 0.1.1 — Added ability for extension (other interfaces for CopyRemote, CopyLocal)
* 0.0.N — Created python sketch and other steps, which are not known yet…


## Requirements ##

    npm install github underscore moment


## Usage ##
    
    // syncing `./settings/` folder
    node app.js username password folder

Where:

* username — your github username
* password — your github password


## Demo ##

    git clone git://github.com/matmuchrapna/STsync.git
    cd STsync/
    npm install github underscore moment
    // run into two different terminals
    node app.js username password ./demo/LocalCopy1/
    // second one after the first script 'doSync' show
    node app.js username password ./demo/LocalCopy2/

    // for resetting local copies
    node demo/reset.js

Demo imitating situation, in which you have two opened text editors on two different machine: **localCopy1** and **localCopy2**.  
**LocalCopy1** initially has default ST2 configuration (with STsync cofiguration files needed for synchronization).  
**LocalCopy2** initially empty.

Firstly run **localCopy1**, it will create gist with it’s contents in your gists archive, and then it will run the permanent synchronization.  
After Stabilizing first sync, run sync in **localCopy2**, it will find valid copy of configuration in gists and will use it, the it will run the permanent synchronization.

Now **LocalCopy1** and **LocalCopy2** is linked with each other. Try to add, edit or remove (exceptions(!)) files. Changes would be applied in **two way** smoothly.

*Remove exceptions* (Required files):

* Default (Linux).sublime-keymap
* Default (OSX).sublime-keymap
* Default (Windows).sublime-keymap
* Preferences.sublime-settings
* stsync.sublime-settings
* stsync.last-sync



[1]: http://sublimetext.userecho.com/topic/111402-syncing-settings-files-and-plugins-list-with-gistgithubcom/ 'Syncing settings files and plugins list with gist.github.com'
[2]: https://github.com/flatiron/winston "multi-transport async logging library for node.js"