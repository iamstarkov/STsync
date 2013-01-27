# STsync #

Sublime Text plugin for syncronizing configuration. Read more in my userecho [suggestion][1].

### Current state: It is workin now, but plugin need testers. ###
    
## How to test ##

You should have [Sublime Text 2][4], [Sublime Package Control][5] and [nodejs][3] to be installed. Also you should have an [GitHub account](6).  

* Backup you configuration
* Run ‘Add repository’ with command line (`Ctrl+Shift+P`).  
    ![Add repository](http://i.imgur.com/O9re7Dr.png)
* Paste repo url into the box and press the enter (`https://github.com/matmuchrapna/STsync`)
    ![add the repo](http://i.imgur.com/GFS9w06.png)
* You will see
    ![success message](http://i.imgur.com/Py8USjd.png)
* After plugin will start. It will open the new tab in your favourite browser and ask your permissions to STsync application — it have permission only to [gist][7] service, And this way is **password input free**.

## Changelog: ##

* 0.1.1  *(25 jan 2012)* — Testing period started
* 0.1.0  *(25 jan 2012)* — Created python wrapper
* 0.0.13 *(24 jan 2012)* — Refactoring end
* 0.0.12 *(23 jan 2012)* — Refactoring: chaining
* 0.0.11 *(20 jan 2012)* — Refactoring: added normal logger ([winston][2]
* 0.0.10 *(18 jan 2012)* — Refactoring start (hide OAUTH in stsync methods)
* 0.0.9  *(18 jan 2012)* — Created OAUTH authorization via web interface
* 0.0.8  *(17 jan 2012)* — Synchronization worked
* 0.0.7  *(16 jan 2012)* — Synchronization demo added (deprecated, because different servers cannot exists at one port, which is one of the required case for using oauth)
* 0.0.6  *(16 jan 2012)* — Update local functionality
* 0.0.5  *(16 jan 2012)* — Update remote functionality added
* 0.0.4  *(15 jan 2012)* — Local and remote copy added
* 0.0.3  *(15 jan 2012)* — Synchronization step added
* 0.0.2  *(15 jan 2012)* — Initializing finished
* 0.0.1  *(09 jan 2012)* — Testing import/export functionality


## Todo ##

* Documentation
* Tests


[1]: http://sublimetext.userecho.com/topic/111402-syncing-settings-files-and-plugins-list-with-gistgithubcom/ 'Syncing settings files and plugins list with gist.github.com'
[2]: https://github.com/flatiron/winston "multi-transport async logging library for node.js"
[3]: http://nodejs.org/ "v0.8.18"
[4]: http://www.sublimetext.com/2 "Sublime Text is a sophisticated text editor for code, markup and prose. You'll love the slick user interface, extraordinary features and amazing performance."
[5]: http://wbond.net/sublime_packages/package_control/installation "http://wbond.net/sublime_packages/package_control/installation"
[6]: https://github.com/ "Github — Build software better, together."
[7]: http://gist.github.com/ "Gist is a simple way to share snippets and pastes with others. All gists are git repositories, so they are automatically versioned, forkable and usable as a git repository."