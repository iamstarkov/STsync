import sublime
import sublime_plugin
import subprocess


class TestCommand(sublime_plugin.ApplicationCommand):
    def __init__(self):
        super(TestCommand, self).__init__()
        packages_path = sublime.packages_path()
        relative_path = '\STsync\\app.js'
        script_path = ''.join([packages_path, relative_path])
        print "path: " + packages_path

        # subprocess.Popen(["node", script_path, sublime.packages_path()], shell=True)
        subprocess.Popen(["node", script_path, packages_path])

    def run(self, edit):
        pass
