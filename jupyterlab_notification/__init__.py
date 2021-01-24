"""Jupyterlab browser notification magic commands"""
__version__ = '0.0.1'

from .jupyterlab_notification import NotificationMagics

def load_ipython_extension(ipython):
    ipython.register_magics(NotificationMagics)