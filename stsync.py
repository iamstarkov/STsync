import sublime
import sublime_plugin

from subprocess import call
call(["node", "app.js", "../User/"], shell=True)
# call(["node", "app.js", "../User/"])
