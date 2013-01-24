import sublime
import sublime_plugin
from subprocess import call


# sublime.packages_path();

class TestCommand(sublime_plugin.ApplicationCommand):
    def __init__(self):
        super(TestCommand, self).__init__()
        #do your stuf here
        # call(["ping", "192.168.1.1"])
        # call(["node", "./Data/Packages/STsync/app.js", "./settings/"])

    def run(self, edit):
        pass
