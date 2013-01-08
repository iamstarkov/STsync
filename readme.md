# STsync #

Sublime Text plugin for syncronising configuration. Read more in my userecho [suggestion](http://sublimetext.userecho.com/topic/111402-syncing-settings-files-and-plugins-list-with-gistgithubcom/).

**Important: ** In development.

## Current state ##

Two basic javascript file for using with [NodeJS](http://nodejs.org/): *export.js*, *import.js*.

## Requirements ##

    npm install github underscore

## Usage ##
    
    node import.js login pswd gistId
    node export.js login pswd [folder]

Where:

* login — your github login
* pswd — your github password
* gistId — gist id you own to import in './import' folder
* folder (optional) — path to folder, which you want to upload to just created gist. By default, './import'.


Roadmap:

* auth by OAUTH key
* merging logic
* python wrapper for using as ST plugin