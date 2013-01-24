import sublime
import sublime_plugin
import subprocess
# from subprocess import call


# sublime.packages_path();

class TestCommand(sublime_plugin.ApplicationCommand):
    def __init__(self):
        super(TestCommand, self).__init__()
        #do your stuf here
        # call(["ping", "192.168.1.1"])
        # call(["node", "app.js", "../User/"], Shell=true)
        # call(["node", "./app-dev.js"])
        #
        # call(["node", "./Data/Packages/STsync/app-dev.js"], Shell=true)
        # call(["node", "./Data/Packages/STsync/app-dev.js"])
        subprocess.Popen(["node", "./Data/Packages/STsync/app-dev.js"])

    def run(self, edit):
        pass
