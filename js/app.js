// Main application initialization
document.addEventListener('DOMContentLoaded', function() {
    // Initialize models
    const taskModel = new TaskModel();
    const eventModel = new EventModel();
    const userSettingsModel = new UserSettingsModel();
    
    // Initialize views
    const taskView = new TaskView();
    const eventView = new EventView();
    const calendarView = new CalendarView();
    const settingsView = new SettingsView();
    
    // Initialize controllers
    const taskController = new TaskController(taskModel, taskView);
    const eventController = new EventController(eventModel, eventView);
    const userSettingsController = new UserSettingsController(userSettingsModel, settingsView);
    
    // Handle navigation between views
    const navButtons = document.querySelectorAll('.nav-button');
    const views = document.querySelectorAll('.view');
    
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetView = this.getAttribute('data-view');
            
            // Update active nav button
            navButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Show target view
            views.forEach(view => {
                view.classList.remove('active');
                if (view.id === `${targetView}-view`) {
                    view.classList.add('active');
                }
            });
            
            // STOP automatic camera start - let user click the button instead
            if (targetView !== 'events') {
                eventController.handleStopCamera();
            }
        });
    });
    
    // Initialize calendar view
    calendarView.displayCalendar(eventModel.getEvents());
	
	window.addEventListener('error', (event) => {
		console.error('Global error:', event.error);
		
		// Remove existing error notifications to prevent duplicates
		const existingNotifications = document.querySelectorAll('.notification.error');
		existingNotifications.forEach(notification => notification.remove());
		
		// user-friendly error message
		const notification = document.createElement('div');
		notification.className = 'notification error';
		notification.textContent = 'Something went wrong. Please refresh the page.';
		document.body.appendChild(notification);
		
		setTimeout(() => {
			if (document.body.contains(notification)) {
				document.body.removeChild(notification);
			}
		}, 5000);
	});

	window.addEventListener('unhandledrejection', (event) => {
		console.error('Unhandled promise rejection:', event.reason);
		event.preventDefault();
		
		// Remove existing error notifications
		const existingNotifications = document.querySelectorAll('.notification.error');
		existingNotifications.forEach(notification => notification.remove());
		
		const notification = document.createElement('div');
		notification.className = 'notification error';
		notification.textContent = 'An unexpected error occurred.';
		document.body.appendChild(notification);
		
		setTimeout(() => {
			if (document.body.contains(notification)) {
				document.body.removeChild(notification);
			}
		}, 5000);
	});
});