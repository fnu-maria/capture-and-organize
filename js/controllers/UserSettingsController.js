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
}