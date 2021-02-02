if (!('Notification' in window)) {
    alert("This browser does not support notifications.");
} else if (Notification.permission !== 'granted') {
    Notification.requestPermission().then(function(result) {
        if (result == 'granted') {
            alert("Browser Notifications are allowed. You can use the %notify magic command now. (^_^)b");
        } else {
            alert("Browser Notifications are not allowed. Please update your browser settings to allow notifications.");
        }
    });
}
