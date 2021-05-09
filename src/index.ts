import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { NotebookActions } from '@jupyterlab/notebook';
import { IObservableJSON } from '@jupyterlab/observables';
import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { checkBrowserNotificationSettings } from './settings';

/**
 * Extracts Code Cell Start and End Time
 */
function extractExecutionMetadata(metadata: IObservableJSON): [Date, Date] {
  const executionMetadata = Object.assign({}, metadata.get('execution') as any);
  const cellStartTime = new Date(
    executionMetadata['shell.execute_reply.started'] ||
      executionMetadata['iopub.execute_input']
  );
  const cellEndTime = new Date(executionMetadata['shell.execute_reply']);
  return [cellStartTime, cellEndTime];
}

/**
 * Constructs notification message and displays it.
 */
function displayNotification(
  cellDuration: string,
  cellNumber: number,
  notebookName: string,
  reportCellNumber: boolean,
  reportCellExecutionTime: boolean
): void {
  const notificationPayload = {
    icon: '/static/favicon.ico',
    body: ''
  };
  let message = '';
  if (reportCellNumber && reportCellExecutionTime) {
    message = `Cell[${cellNumber}] Duration: ${cellDuration}`;
  } else if (reportCellNumber) {
    message = `Cell Number: ${cellNumber}`;
  } else if (reportCellExecutionTime) {
    message = `Cell Duration: ${cellDuration}`;
  }

  notificationPayload.body = message;
  new Notification(`${notebookName} Cell Completed!`, notificationPayload);
}

const extension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-notifications:plugin',
  autoStart: true,
  optional: [ISettingRegistry],
  activate: async (app: JupyterFrontEnd, settingRegistry: ISettingRegistry) => {
    checkBrowserNotificationSettings();
    let enabled = true;
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
        const codeCell = cell.model.type === 'code';
        const nonEmptyCell = cell.model.value.text.length > 0;
        const metadata = cell.model.metadata;
        if (codeCell && nonEmptyCell) {
          if (metadata.has('execution')) {
            const [cellStartTime, cellEndTime] = extractExecutionMetadata(
              metadata
            );
            const diff = new Date(<any>cellEndTime - <any>cellStartTime);
            if (diff.getSeconds() >= minimumCellExecutionTime) {
              const cellDuration = diff.toISOString().substr(11, 8);
              const cellNumber = notebook.activeCellIndex;
              const notebookName = notebook.title.label;
              displayNotification(
                cellDuration,
                cellNumber,
                notebookName,
                reportCellNumber,
                reportCellExecutionTime
              );
            }
          } else {
            alert(
              'Notebook Cell Timing needs to be enabled for Jupyterlab Notifications to work. ' +
                'Please go to Settings -> Advanced Settings Editor -> Notebook and update setting to {"recordTiming": true}'
            );
          }
        }
      }
    });
  }
};

export default extension;
