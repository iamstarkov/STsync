# STsync #

Sublime Text plugin for syncronising configuration. Read more in my userecho [suggestion][1].

### Current state: in active development ###

## Changelog: ##

* 0.0.5 *(16 jan 2012)* — Update remote functionality added
* 0.0.4 *(15 jan 2012)* — Local and remote copy added
* 0.0.3 *(15 jan 2012)* — Synchronization step added
* 0.0.2 *(15 jan 2012)* — Initializing finished
* 0.0.1 *(09 jan 2012)* — Testing import/export functionality

## Roadmap ##

* 0.0.6 — Update local functionality
* 0.0.7 — Synchronization worked
* 0.0.8 — Refactoring start
* 0.0.9 — Refactoring: added normal logger ([winston][2]
* 0.0.10 — Refactoring: polimorhism for CopyLocal and CopyRemote
* 0.0.11 — Refactoring: chaining
* 0.0.12 — Refactoring end
* 0.0.13 — Documentation writed and compiled
* 0.0.14 — Tests writed
* 0.0.15 — Tests successfully passing
* 0.0.16 — Created OAUTH authorization via web interface
* 0.1.0 — Created python wrapper sketch…
* 0.1.1 — Added ability for extension (other interfaces for CopyRemote, CopyLocal)
* 0.0.N — Created python sketch and other steps, which are not known yet…

## Requirements ##

    npm install github underscore moment

## Usage ##
    
    // syncing `./settings/` folder
    node asyncStSync.js login password


Where:

* login — your github login
* password — your github password








[1]: http://sublimetext.userecho.com/topic/111402-syncing-settings-files-and-plugins-list-with-gistgithubcom/ 'Syncing settings files and plugins list with gist.github.com'
[2]: https://github.com/flatiron/winston "multi-transport async logging library for node.js"