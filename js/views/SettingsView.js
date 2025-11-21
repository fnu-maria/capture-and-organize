class SettingsView {
    constructor() {
        this.themeSelect = document.getElementById('theme-select');
        this.fontSizeSelect = document.getElementById('font-size');
        this.saveSettingsBtn = document.getElementById('save-settings-btn');
        this.clearDataBtn = document.getElementById('clear-data-btn');
    }

    bindSaveSettings(handler) {
        this.saveSettingsBtn.addEventListener('click', () => {
            const settings = {
                theme: this.themeSelect.value,
                fontSize: this.fontSizeSelect.value
            };
            handler(settings);
        });
    }

    bindClearData(handler) {
        this.clearDataBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all data? This cannot be undone!')) {
                handler();
            }
        });
    }

    displaySettings(settings) {
        if (settings.theme) {
            this.themeSelect.value = settings.theme;
        }
        if (settings.fontSize) {
            this.fontSizeSelect.value = settings.fontSize;
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 3000);
    }
}