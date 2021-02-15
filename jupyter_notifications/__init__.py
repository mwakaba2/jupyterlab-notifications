"""Jupyterlab browser notification magic commands"""
__version__ = "1.0.3"

from .jupyter_notifications import NotificationMagics


def load_ipython_extension(ipython):
    ipython.register_magics(NotificationMagics)
