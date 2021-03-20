function checkNotificationPromise(): boolean {
  try {
    Notification.requestPermission().then();
  } catch (e) {
    return false;
  }
  return true;
}

function handlePermission(permission: string): void {
  if (permission === 'granted') {
    alert('Browser Notifications are allowed. (^_^)b');
  } else {
    alert(
      'Browser Notifications are not allowed. Please update your browser settings to allow notifications.'
    );
  }
}

export function checkBrowserNotificationSettings(): void {
  if (!('Notification' in window)) {
    alert('This browser does not support notifications.');
  } else if (Notification.permission !== 'granted') {
    if (checkNotificationPromise()) {
      Notification.requestPermission().then(permission => {
        handlePermission(permission);
      });
    } else {
      Notification.requestPermission(permission => {
        handlePermission(permission);
      });
    }
  }
}
