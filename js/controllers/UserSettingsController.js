class UserSettingsController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        
        this.view.bindSaveSettings(this.handleSaveSettings.bind(this));
        this.view.bindClearData(this.handleClearData.bind(this));
        this.view.displaySettings(this.model.getSettings());
    }

    handleSaveSettings(settings) {
        this.model.saveSettings(settings);
        this.view.showNotification('Settings saved successfully!');
    }

    handleClearData() {
        this.model.clearAllData();
        this.view.showNotification('All data cleared successfully!');
    
        // Reload the page to reflect changes
        setTimeout(() => {
            location.reload();
        }, 1000);
    }

	async requestNotificationPermission() {
		if ('Notification' in window) {
			const permission = await Notification.requestPermission();
			if (permission === 'granted') {
				this.model.saveSettings({ notificationsEnabled: true });
				this.view.showNotification('Notifications enabled!');
			}
		}
	}

	// notification scheduling
	scheduleEventNotifications(event) {
		if (this.model.areNotificationsEnabled()) {
			const eventTime = new Date(event.date);
			const notifyTime = new Date(eventTime.getTime() - 30 * 60 * 1000); // 30 min before
			
			setTimeout(() => {
				new Notification('Upcoming Event', {
					body: `${event.title} starts in 30 minutes`,
					icon: '/icon.png'
				});
			}, notifyTime - Date.now());
		}
	}
	function 
}