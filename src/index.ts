import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { KernelError, Notebook, NotebookActions } from '@jupyterlab/notebook';
import { Cell } from '@jupyterlab/cells';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ICodeCellModel } from '@jupyterlab/cells';

import { checkBrowserNotificationSettings } from './settings';

interface ICellExecutionMetadata {
  index: number;
  scheduledTime: Date;
  endTime?: Date;
  startTime?: Date;
}

/**
 * Constructs notification message and displays it.
 */
function displayNotification(
  cellDuration: string,
  cellNumber: number,
  notebookName: string,
  reportCellNumber: boolean,
  reportCellExecutionTime: boolean,
  failedExecution: boolean,
  error: KernelError | null
): void {
  const notificationPayload = {
    icon: '/static/favicon.ico',
    body: ''
  };
  const title = failedExecution
    ? `${notebookName} Failed!`
    : `${notebookName} Completed!`;
  let message = '';

  if (failedExecution) {
    message = error ? `${error.errorName} ${error.errorValue}` : '';
  } else if (reportCellNumber && reportCellExecutionTime) {
    message = `Cell[${cellNumber}] Duration: ${cellDuration}`;
  } else if (reportCellNumber) {
    message = `Cell Number: ${cellNumber}`;
  } else if (reportCellExecutionTime) {
    message = `Cell Duration: ${cellDuration}`;
  }

  notificationPayload.body = message;
  new Notification(title, notificationPayload);
}

/**
 * Trigger notification.
 */
function triggerNotification(
  cell: Cell,
  notebook: Notebook,
  executionMetadata: ICellExecutionMetadata,
  minimumCellExecutionTime: number,
  reportCellNumber: boolean,
  reportCellExecutionTime: boolean,
  cellNumberType: string,
  failedExecution: boolean,
  error: KernelError | null
) {
  const { startTime, endTime, index: cellIndex } = executionMetadata;
  const codeCell = cell.model.type === 'code';
  const nonEmptyCell = cell.model.value.text.length > 0;
  if (codeCell && nonEmptyCell) {
    const codeCellModel = cell.model as ICodeCellModel;
    const diff = new Date(<any>endTime - <any>startTime);
    const diffSeconds = Math.floor(diff.getTime() / 1000);
    if (diffSeconds >= minimumCellExecutionTime) {
      const cellDuration = diff.toISOString().substr(11, 8);
      const cellNumber =
        cellNumberType === 'cell_index'
          ? cellIndex
          : codeCellModel.executionCount;
      const notebookName = notebook.title.label.replace(/\.[^/.]+$/, '');
      displayNotification(
        cellDuration,
        cellNumber,
        notebookName,
        reportCellNumber,
        reportCellExecutionTime,
        failedExecution,
        error
      );
    }
  }
}

const extension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-notifications:plugin',
  autoStart: true,
  requires: [ISettingRegistry],
  activate: async (app: JupyterFrontEnd, settingRegistry: ISettingRegistry) => {
    checkBrowserNotificationSettings();
    let enabled = true;
    let minimumCellExecutionTime = 60;
    let reportCellExecutionTime = true;
    let reportCellNumber = true;
    let cellNumberType = 'cell_index';
    const cellExecutionMetadataTable: {
      [cellId: string]: ICellExecutionMetadata;
    } = {};
    const recentNotebookExecutionTimes: {
      [notebookId: string]: Date;
    } = {};

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
        cellNumberType = setting.get('cell_number_type').composite as string;
      };
      updateSettings();
      setting.changed.connect(updateSettings);
    }

    NotebookActions.executionScheduled.connect((_, args) => {
      const { cell, notebook } = args;
      if (enabled) {
        cellExecutionMetadataTable[cell.model.id] = {
          index: notebook.activeCellIndex,
          scheduledTime: new Date()
        };
      }
    });

    NotebookActions.executed.connect((_, args) => {
      if (enabled) {
        const cellEndTime = new Date();
        const { cell, notebook, success, error } = args;
        const cellId = cell.model.id;
        const notebookId = notebook.id;
        const scheduledTime = cellExecutionMetadataTable[cellId].scheduledTime;
        const recentExecutedCellTime =
          recentNotebookExecutionTimes[notebookId] || scheduledTime;
        cellExecutionMetadataTable[cellId].startTime =
          scheduledTime >= recentExecutedCellTime
            ? scheduledTime
            : recentExecutedCellTime;
        cellExecutionMetadataTable[cellId].endTime = cellEndTime;
        recentNotebookExecutionTimes[notebookId] = cellEndTime;

        triggerNotification(
          cell,
          notebook,
          cellExecutionMetadataTable[cellId],
          minimumCellExecutionTime,
          reportCellNumber,
          reportCellExecutionTime,
          cellNumberType,
          !success,
          error
        );
        delete cellExecutionMetadataTable[cellId];
      }
    });
  }
};

export default extension;
