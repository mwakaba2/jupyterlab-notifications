import { ISessionContext } from '@jupyterlab/apputils';
import { Kernel, KernelAPI, KernelMessage } from '@jupyterlab/services';

export async function ensureSessionContextKernelActivated(
  sessionContext: ISessionContext
): Promise<void> {
  if (sessionContext.hasNoKernel) {
    await sessionContext
      .initialize()
      .then(async value => {
        if (value) {
          const py3kernel = await KernelAPI.startNew({ name: 'python3' });
          await sessionContext.changeKernel(py3kernel);
        }
      })
      .catch(reason => {
        console.error(
          `Failed to initialize the session in jupyterlab-notifications.\n${reason}`
        );
      });
  }
}

export async function issueNtfyNotification(
  title: string,
  notificationPayload: { body: string },
  sessionContext: ISessionContext
): Promise<
  Kernel.IShellFuture<
    KernelMessage.IExecuteRequestMsg,
    KernelMessage.IExecuteReplyMsg
  >
> {
  const { body } = notificationPayload;
  await ensureSessionContextKernelActivated(sessionContext);
  if (!sessionContext || !sessionContext.session?.kernel) {
    return;
  }
  const titleEscaped = title.replace(/"/g, '\\"');
  const bodyEscaped = body.replace(/"/g, '\\"');
  const code = `from ntfy import notify; notify("${bodyEscaped}", "${titleEscaped}")`;
  return sessionContext.session?.kernel?.requestExecute({ code });
}
