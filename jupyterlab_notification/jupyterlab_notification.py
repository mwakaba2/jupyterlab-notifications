from IPython.core import magic_arguments
from IPython.core.getipython import get_ipython
from IPython.core.magic import Magics, magics_class, cell_magic
from IPython.display import display, Javascript
from pkg_resources import resource_filename


@magics_class
class NotificationMagics(Magics):
    def __init__(self, shell, **kwargs):
        self.options = {"icon": "/static/favicon.ico"}
        self._check_browser_notification_support()
        super().__init__(shell=shell, **kwargs)
    
    def _check_browser_notification_support(self):
        # TODO check if notifications are supported or turned on 
        pass

    def _show_notification(self):
        js_filename = resource_filename("jupyterlab_notification", "js/notification.js")
        with open(js_filename) as js_file:
            js_string = js_file.read().format(notification_options=self.options)
            display(Javascript(data=js_string))

    @magic_arguments.magic_arguments()
    @magic_arguments.argument(
        "--message",
        "-m",
        default="Notebook cell finished!",
        help="Custom notification message.",
    )
    @cell_magic
    def notify(self, line, cell=None):
        args = magic_arguments.parse_argstring(self.notify, line)
        self.options["body"] = args.message

        ipython = get_ipython()
        ipython.run_cell(cell)
        self._show_notification()

    
