# Jupyter Notifications
Notebook Cell Completion Browser Notifications for Jupyter Notebook and Lab. 

## Installation

Install the package via pip.
```
pip install jupyter-notifications
```
Add the extension in the ipython kernel config's `c.InteractiveShellApp.extensions` section. 
```
~/.ipython/profile_default/ipython_kernel_config.py
...
c.InteractiveShellApp.extensions = [ "jupyter_notification" ]
```
Then spin up jupyter notebook or lab with 
```
$ jupyter notebook
$ jupyter lab
``` 

### TODOS

* Update jupyterlab_notifications to jupyter_notifications
* add what browsers are supported
* add requirements to flit
* explain how to build for development
* publish with flit
