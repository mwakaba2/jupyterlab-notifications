function checkNotificationPromise() {
    try {
        Notification.requestPermission().then();
    } catch(e) {
        return false;
    }
    
    return true;
}

function handlePermission(permission) {
    if (permission == 'granted') {
        alert("Browser Notifications are allowed. You can use the %notify magic command now. (^_^)b");
    } else {
        alert("Browser Notifications are not allowed. Please update your browser settings to allow notifications.");
    }
}

if (!('Notification' in window)) {
    alert("This browser does not support notifications.");
} else if (Notification.permission !== 'granted') {
    if(checkNotificationPromise()) {
        Notification.requestPermission().then((permission) => {
            handlePermission(permission);
        })
    } else {
        Notification.requestPermission(function(permission) {
            handlePermission(permission);
        });
    }
}
