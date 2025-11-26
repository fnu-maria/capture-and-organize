class UserSettingsModel {
    constructor() {
        this.settings = this.loadSettings();
        this.applySettings();
    }

    loadSettings() {
        const settings = localStorage.getItem('userSettings');
        return settings ? JSON.parse(settings) : {
            theme: 'light',
            fontSize: '14'
        };
    }

    saveSettings(settings) {
        this.settings = { ...this.settings, ...settings };
        localStorage.setItem('userSettings', JSON.stringify(this.settings));
        this.applySettings();
        return this.settings;
    }

    getSettings() {
        return this.settings;
    }

    applySettings() {
        // Apply theme
        document.documentElement.setAttribute('data-theme', this.settings.theme);
        
        // Apply font size
        document.body.style.fontSize = this.settings.fontSize + 'px';
    }
	    areNotificationsEnabled() {
        return this.settings.notificationsEnabled;
    }
	
	exportData() {
		const data = {
			tasks: this.tasks,
			events: this.events,
			settings: this.settings,
			exportDate: new Date().toISOString()
		};
		
		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `capture-organize-backup-${new Date().toISOString().split('T')[0]}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

    clearAllData() {
        localStorage.removeItem('tasks');
        localStorage.removeItem('events');
        localStorage.removeItem('userSettings');
        this.settings = this.loadSettings();
        this.applySettings();
    }
}