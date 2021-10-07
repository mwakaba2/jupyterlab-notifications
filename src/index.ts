import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ISessionContext, SessionContext } from '@jupyterlab/apputils';
import { KernelError, Notebook, NotebookActions } from '@jupyterlab/notebook';
import { Cell } from '@jupyterlab/cells';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ICodeCellModel } from '@jupyterlab/cells';
import { PageConfig } from '@jupyterlab/coreutils';
import LRU from 'lru-cache';
import moment from 'moment';
import { issueNtfyNotification } from './ntfy';
import { checkBrowserNotificationSettings } from './settings';

interface ICellExecutionMetadata {
  index: number;
  scheduledTime: Date;
}

/**
 * Constructs notification message and displays it.
 */
async function displayNotification(
  cellDuration: string,
  cellNumber: number,
  notebookName: string,
  reportCellNumber: boolean,
  reportCellExecutionTime: boolean,
  failedExecution: boolean,
  error: KernelError | null,
  lastCellOnly: boolean,
  notificationMethods: string[],
  sessionContext: ISessionContext | null
): Promise<void> {
  const base = PageConfig.getBaseUrl();
  const notificationPayload = {
    icon: base + 'static/favicon.ico',
    body: ''
  };
  const title = failedExecution
    ? `${notebookName} Failed!`
    : `${notebookName} Completed!`;
  let message = '';

  if (failedExecution) {
    message = error ? `${error.errorName} ${error.errorValue}` : '';
  } else if (lastCellOnly) {
    message = `Total Duration: ${cellDuration}`;
  } else if (reportCellNumber && reportCellExecutionTime) {
    message = `Cell[${cellNumber}] Duration: ${cellDuration}`;
  } else if (reportCellNumber) {
    message = `Cell Number: ${cellNumber}`;
  } else if (reportCellExecutionTime) {
    message = `Cell Duration: ${cellDuration}`;
  }

  notificationPayload.body = message;

  if (notificationMethods.includes('browser')) {
    new Notification(title, notificationPayload);
  }
  if (notificationMethods.includes('ntfy') && sessionContext) {
    await issueNtfyNotification(title, notificationPayload, sessionContext);
  }
}

/**
 * Trigger notification.
 */
async function triggerNotification(
  cell: Cell,
  notebook: Notebook,
  cellExecutionMetadataTable: LRU<string, ICellExecutionMetadata>,
  recentNotebookExecutionTimes: LRU<string, Date>,
  minimumCellExecutionTime: number,
  reportCellNumber: boolean,
  reportCellExecutionTime: boolean,
  cellNumberType: string,
  failedExecution: boolean,
  error: KernelError | null,
  lastCellOnly: boolean,
  notificationMethods: string[],
  sessionContext: ISessionContext | null
) {
  const cellEndTime = new Date();
  const codeCellModel = cell.model as ICodeCellModel;
  const codeCell = codeCellModel.type === 'code';
  const nonEmptyCell = codeCellModel.value.text.length > 0;
  if (codeCell && nonEmptyCell) {
    const cellId = codeCellModel.id;
    const notebookId = notebook.id;
    const cellExecutionMetadata = cellExecutionMetadataTable.get(cellId);
    const scheduledTime = cellExecutionMetadata.scheduledTime;
    // Get the cell's execution scheduled time if the recent notebook execution state doesn't exist.
    // This happens commonly for first time notebook executions or notebooks that haven't been executed for a while.
    const recentExecutedCellTime =
      recentNotebookExecutionTimes.get(notebookId) || scheduledTime;

    // Multiple cells can be scheduled at the same time, and the schedule time doesn't necessarily equate to the actual start time.
    // If another cell has been executed more recently than the current cell's scheduled time, treat the recent execution as the cell's start time.
    const cellStartTime =
      scheduledTime >= recentExecutedCellTime
        ? scheduledTime
        : recentExecutedCellTime;
    recentNotebookExecutionTimes.set(notebookId, cellEndTime);
    const cellDuration = moment
      .utc(moment(cellEndTime).diff(cellStartTime))
      .format('HH:mm:ss');
    const diffSeconds = moment.duration(cellDuration).asSeconds();
    if (diffSeconds >= minimumCellExecutionTime) {
      const cellNumber =
        cellNumberType === 'cell_index'
          ? cellExecutionMetadata.index
          : codeCellModel.executionCount;
      const notebookName = notebook.title.label.replace(/\.[^/.]+$/, '');
      await displayNotification(
        cellDuration,
        cellNumber,
        notebookName,
        reportCellNumber,
        reportCellExecutionTime,
        failedExecution,
        error,
        lastCellOnly,
        notificationMethods,
        sessionContext
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
    let lastCellOnly = false;
    let notificationMethods = ['browser'];

    const cellExecutionMetadataTable: LRU<
      string,
      ICellExecutionMetadata
    > = new LRU({
      max: 500 * 5 // to save 500 notebooks x 5 cells
    });
    const recentNotebookExecutionTimes: LRU<string, Date> = new LRU({
      max: 500
    });

    // SessionContext is used for running python codes
    const manager = app.serviceManager;
    const sessionContext = new SessionContext({
      sessionManager: manager.sessions as any,
      specsManager: manager.kernelspecs
    });

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
        lastCellOnly = setting.get('last_cell_only').composite as boolean;
        notificationMethods = setting.get('notification_methods')
          .composite as string[];
      };
      updateSettings();
      setting.changed.connect(updateSettings);
    }

    NotebookActions.executionScheduled.connect((_, args) => {
      const { cell, notebook } = args;
      if (enabled) {
        cellExecutionMetadataTable.set(cell.model.id, {
          index: notebook.activeCellIndex,
          scheduledTime: new Date()
        });
      }
    });

    NotebookActions.executed.connect(async (_, args) => {
      if (enabled && !lastCellOnly) {
        const { cell, notebook, success, error } = args;
        await triggerNotification(
          cell,
          notebook,
          cellExecutionMetadataTable,
          recentNotebookExecutionTimes,
          minimumCellExecutionTime,
          reportCellNumber,
          reportCellExecutionTime,
          cellNumberType,
          !success,
          error,
          lastCellOnly,
          notificationMethods,
          sessionContext
        );
      }
    });

    NotebookActions.selectionExecuted.connect(async (_, args) => {
      if (enabled && lastCellOnly) {
        const { lastCell, notebook } = args;
        const failedExecution = false;
        await triggerNotification(
          lastCell,
          notebook,
          cellExecutionMetadataTable,
          recentNotebookExecutionTimes,
          minimumCellExecutionTime,
          reportCellNumber,
          reportCellExecutionTime,
          cellNumberType,
          failedExecution,
          null,
          lastCellOnly,
          notificationMethods,
          sessionContext
        );
      }
    });
  }
};

export default extension;
