import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { NotebookActions } from '@jupyterlab/notebook';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { checkBrowserNotificationSettings } from './settings';

const extension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-notifications:plugin',
  autoStart: true,
  optional: [ISettingRegistry],
  activate: async (app: JupyterFrontEnd, settingRegistry: ISettingRegistry) => {
    checkBrowserNotificationSettings();
    let enabled = false;
    let minimumCellExecutionTime = 60;
    let reportCellExecutionTime = true;
    let reportCellNumber = true;
    if (settingRegistry) {
      const setting = await settingRegistry.load(extension.id);
      const updateSettings = (): void => {
        enabled = setting.get('enabled').composite as boolean;
        minimumCellExecutionTime = setting.get('minimum_cell_execution_time')
          .composite as number;
        reportCellExecutionTime = setting.get('report_cell_execution_time')
          .composite as boolean;
        reportCellNumber = setting.get('report_cell_number')
          .composite as boolean;
      };
      updateSettings();
      setting.changed.connect(updateSettings);
    }

    NotebookActions.executed.connect((_, args) => {
      if (enabled) {
        const { cell, notebook } = args;
        const metadata = cell.model.metadata;
        if (metadata.has('execution')) {
          const executionMetadata = Object.assign(
            {},
            metadata.get('execution') as any
          );
          const cellStartTime = new Date(
            executionMetadata['shell.execute_reply.started']
          );
          const cellEndTime = new Date(
            executionMetadata['shell.execute_reply']
          );
          const diff = new Date(<any>cellEndTime - <any>cellStartTime);
          if (diff.getSeconds() >= minimumCellExecutionTime) {
            const notificationPayload = {
              icon: '/static/favicon.ico',
              body: ''
            };
            let message = '';
            const cellDuration = diff.toISOString().substr(11, 8);
            const cellNumber = notebook.activeCellIndex;
            if (reportCellNumber && reportCellExecutionTime) {
              message = `Cell[${cellNumber}] Duration: ${cellDuration}`;
            } else if (reportCellNumber) {
              message = `Cell Number: ${cellNumber}`;
            } else if (reportCellExecutionTime) {
              message = `Cell Duration: ${cellDuration}`;
            }
            notificationPayload.body = message;
            new Notification('Notebook Cell Completed!', notificationPayload);
          }
        } else {
          alert(
            'Notebook Cell Timing needs to be enabled for Jupyterlab Notifications to work. ' +
              'Please go to Settings -> Advanced Settings Editor -> Notebook and update setting to {"recordTiming": true}'
          );
        }
      }
    });
  }
};

export default extension;
