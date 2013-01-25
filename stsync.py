import sublime
import sublime_plugin
import subprocess
# from subprocess import call


class TestCommand(sublime_plugin.ApplicationCommand):
    def __init__(self):
        super(TestCommand, self).__init__()
        # subprocess.Popen(["node", "./Data/Packages/STsync/app-dev.js"], shell=True)
        # subprocess.Popen(["node", "./Data/Packages/STsync/app-dev.js"])
        packages_path = sublime.packages_path()
        relative_path = '\STsync\\app-dev.js'
        # relative_path = '\STsync\\echo.js'
        script_path = ''.join([packages_path, relative_path])
        # D:\Dropbox\programs\ST2\Data\Packages
        subprocess.Popen(["node", script_path, sublime.packages_path()])

    def run(self, edit):
        pass
