import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { NotebookActions } from '@jupyterlab/notebook';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

/**
 * Initialization data for the jupyterlab-cell-flash extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-cell-flash:plugin',
  autoStart: true,
  optional: [ISettingRegistry],
  activate: async (app: JupyterFrontEnd, settingRegistry: ISettingRegistry) => {
    var enabled = false;
    var minimum_cell_execution_time = 60;
    if (settingRegistry) {
      const setting = await settingRegistry.load(extension.id);
      const root = document.documentElement;
      const updateSettings = (): void => {
        enabled = setting.get('enabled').composite as boolean;
        minimum_cell_execution_time = setting.get('minimum_cell_execution_time').composite as number;
      };
      updateSettings();
      setting.changed.connect(updateSettings);
    }

    NotebookActions.executed.connect((_, args) => {
      const { cell } = args;
      alert(minimum_cell_execution_time);
      console.log(cell);
      if (enabled) {
        alert("whooo!");
        // Display notification
      }
    });
  }
};

export default extension;
