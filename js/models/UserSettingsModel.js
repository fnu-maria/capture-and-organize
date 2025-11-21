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

    clearAllData() {
        localStorage.removeItem('tasks');
        localStorage.removeItem('events');
        localStorage.removeItem('userSettings');
        this.settings = this.loadSettings();
        this.applySettings();
    }
}