# jupyterlab-notifications

![Github Actions Status](https://github.com/mwakaba2/jupyterlab-notifications/workflows/Build/badge.svg)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/mwakaba2/jupyterlab-notifications/main?urlpath=lab/tree/tutorial/py3_demo.ipynb)
[![PyPI](https://img.shields.io/pypi/v/jupyterlab-notifications.svg)](https://pypi.org/project/jupyterlab-notifications)
[![npm](https://img.shields.io/npm/v/jupyterlab-notifications.svg)](https://www.npmjs.com/package/jupyterlab-notifications)
[![Conda Version](https://img.shields.io/conda/vn/conda-forge/jupyterlab-notifications.svg)](https://anaconda.org/conda-forge/jupyterlab-notifications)

### Notebook Cell Completion Browser Notifications for JupyterLab. 

*Image of successful notebook cell execution notification*

<img width="387" alt="notification" src="https://user-images.githubusercontent.com/3497137/118382531-3275eb80-b5bc-11eb-9810-5b92183609c3.png">

*Image of failed notebook cell execution notification* (Available only in >= v0.3.0)

<img width="389" alt="error_notification" src="https://user-images.githubusercontent.com/3497137/126079534-cd2425be-3b2b-4410-b951-91f54c25ad6a.png">

*Image of last selected notebook cell execution notification* (Available only in >= v0.3.0)

<img width="394" alt="last_selected_notebook_cell_notification" src="https://user-images.githubusercontent.com/3497137/127746862-79012afd-caa7-4319-930d-7acfc74fa2f4.png">

*Image of mobile phone notifications using `ntfy` + Pushover*

<p float="left">
    <img width="300" alt="pushover_iphone_example" src="https://user-images.githubusercontent.com/3497137/136384645-843b8496-ad40-4c89-998b-ff46ea9f73a7.png">
    <img width="300" alt="pushover_android_example" src="https://user-images.githubusercontent.com/3497137/136384911-1759a502-b51b-4da2-bbe9-a0244c4de468.png">

</p>

## Quick demos and tutorials :notebook:

To test out this extension without any local set-up, please check out the [binder link](https://mybinder.org/v2/gh/mwakaba2/jupyterlab-notifications/main?urlpath=lab/tree/tutorial/py3_demo.ipynb). This will set-up the environment, install the extension, and take you to several demo notebooks for you to play around with to get familiar with the notifications extension. 

In the `tutorial` directory, there are several example notebooks you can use to test out the notifications extension.

* Notebooks with `py3_demo_` prefix - Minimal Python3 Notebooks to test out the extension.
* `julia_demo.ipynb` - Minimal Julia Notebook to test out the extension. :warning: Note: The `tutorial/julia_demo.ipynb` will not work in the binder environment and will require additional set-up to test the Julia Notebook Kernel locally. 

## Compatible Versions and Requirements 🧰

| `jupyterlab-notifications` | `jupyterlab`  | `Notebook Cell Timing Enabled` | `Browser Requirements` |
|--------------------------- |---------------| -------------------------------| ---------------------- |
|  `>=0.3.0`                 | `>=3.1.0`     | Not required                   | Supports the Notification Web API* 
|  `<0.3.0`                  | `>3.0.0`      | Required                       | Supports the Notification Web API*                      |

*For Notification Web API support, please check out [Browser Compatibility Chart](https://developer.mozilla.org/en-US/docs/Web/API/notification#browser_compatibility))

## Install

For JupyterLab 3.x, the extension can be installed with `pip`:

```bash
pip install jupyterlab-notifications
```

or `conda`:

```bash
conda install -c conda-forge jupyterlab-notifications
```

## Settings

Use the following settings to update cell execution time for a notification and information to display in the notification. (in `Settings > Advanced Settings Editor`):

```json5
{
    // Notifications
    // jupyterlab-notifications:plugin
    // Settings for the Notifications extension
    // ****************************************

    // Cell Number Type
    // Type of cell number to display when the report_cell_number is true. Select from 'cell_index' or ‘cell_execution_count'.
    "cell_number_type": "cell_index",

    // Enabled Status
    // Enable the extension or not.
    "enabled": true,

    // Trigger only for the last selected notebook cell execution.
    // Trigger a notification only for the last selected executed notebook cell.
    // NOTE: Only Available in version >= v0.3.0
    "last_cell_only": false,

    // Minimum Notebook Cell Execution Time
    // The minimum execution time to send out notification for a particular notebook cell (in seconds).
    "minimum_cell_execution_time": 60,

    // Notification Methods
    // Option to send a notification with the specified method(s). The available options are 'browser' and 'ntfy'.
    "notification_methods": [
        "browser"
    ],

    // Report Notebook Cell Execution Time
    // Display notebook cell execution time in the notification. 
    // If last_cell_only is set to true, the total duration of the selected cells will be displayed.
    "report_cell_execution_time": true,

    // Report Notebook Cell Number
    // Display notebook cell number in the notification.
    "report_cell_number": true
}
```

![notification](https://user-images.githubusercontent.com/3497137/111881088-01db5200-897d-11eb-8faa-4701cabfcde4.gif)

### How to enable Notebook Cell Timing

:warning: For versions < `0.3.0`, Notebook Cell Timing needs to be enabled for Jupyterlab Notifications to work. Please go to Settings -> Advanced Settings Editor -> Notebook and update setting to:
```json5
{
  // Recording timing
  // Should timing data be recorded in cell metadata
  "recordTiming": true
}
```

The cell timing doesn't need to be enabled for Jupyterlab >= 3.1 and Jupyterlab notification version >= v0.3.0.

## (Optional) Notifications using `ntfy`

You can recieve notifications via `ntfy`.

**ntfy 2.7.0 documentation** https://ntfy.readthedocs.io/en/latest/

> ntfy brings notification to your shell. It can automatically provide desktop notifications when long running code executions finish or it can send push notifications to your phone when a specific execution finishes.

### How to enable notifications via `ntfy`

Install `ntfy`.

```console
$ pip install ntfy
```
You can find configuration instructions for different operating systems in [the ntfy official configuration docs](https://ntfy.readthedocs.io/en/latest/#configuring-ntfy)

For example, if you want to get notifications via the [Pushover mobile app](https://pushover.net/), make sure to create the configuration file in the right location and select `pushover` for the backend.

```console
$ vim ~/.config/ntfy/ntfy.yml # Linux
$ vim ~/Library/Application Support/ntfy/ntfy.yml # macOS
```

**Note:** You'll need to first install the Pushover mobile app and create an account to generate your user key. 
```yaml
backends:
    - pushover
pushover:
    user_key: YOUR_PUSHOVER_USER_KEY
```

Change the notifications [settings](#settings). Append `"ntfy"` into `notification_methods` attribute.
- NOTE: The value `browser` implies default conventional method, which uses Webbrowser's Notification API.

```json5
{
    // ...
    "notification_methods": ["browser", "ntfy"]
    // ...
}
```

## Contributing

### Development install

Note: You will need NodeJS to build the extension package.

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
# Change directory to the jupyterlab-notifications directory
# Install package in development mode
pip install -e .
# Link your development version of the extension with JupyterLab
jlpm run install:extension
# Rebuild extension Typescript source after making changes
jlpm run build
```

You can watch the source directory and run JupyterLab at the same time in different terminals to watch for changes in the extension's source and automatically rebuild the extension.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
jlpm run watch
# Run JupyterLab in another terminal
jupyter lab
```

With the watch command running, every saved change will immediately be built locally and available in your running JupyterLab. Refresh JupyterLab to load the change in your browser (you may need to wait several seconds for the extension to be rebuilt).

### Uninstall

```bash
pip uninstall jupyterlab-notifications
```
