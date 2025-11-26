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
    const navButtons = document.querySelectorAll('.nav-btn');
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
            
            // Handle camera when switching to/from events view
            if (targetView === 'events') {
                eventController.handleStartCamera();
            } else {
                eventController.handleStopCamera();
            }
        });
    });
    
    // Initialize calendar view
    calendarView.displayCalendar(eventModel.getEvents());
});