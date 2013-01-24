import sublime
import sublime_plugin
import subprocess
# from subprocess import call


# sublime.packages_path();

class TestCommand(sublime_plugin.ApplicationCommand):
    def __init__(self):
        super(TestCommand, self).__init__()
        subprocess.Popen(["node", "./Data/Packages/STsync/app-dev.js"], shell=True)

    def run(self, edit):
        pass
