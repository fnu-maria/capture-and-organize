class CalendarView {
    constructor() {
        this.calendarElement = document.getElementById('calendar');
        this.currentDate = new Date();
        this.events = [];
    }

    displayCalendar(events) {
        this.events = events || [];
        this.renderCalendar();
    }

    renderCalendar() {
        const today = new Date();
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Get first day of month and total days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        this.calendarElement.innerHTML = `
            <div class="calendar-container">
                <div class="calendar-header">
                    <button class="calendar-nav" id="prev-month">←</button>
                    <h3>${this.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
                    <button class="calendar-nav" id="next-month">→</button>
                </div>
                
                <div class="calendar-grid">
                    <div class="calendar-weekdays">
                        <div class="weekday">Sun</div>
                        <div class="weekday">Mon</div>
                        <div class="weekday">Tue</div>
                        <div class="weekday">Wed</div>
                        <div class="weekday">Thu</div>
                        <div class="weekday">Fri</div>
                        <div class="weekday">Sat</div>
                    </div>
                    <div class="calendar-days" id="calendar-days"></div>
                </div>
                
                <div class="calendar-events-preview">
                    <h4>📅 Events This Month</h4>
                    <div id="month-events-list"></div>
                </div>
            </div>
        `;

        this.renderDays(year, month, daysInMonth, startingDay, today);
        this.bindNavigation();
        this.displayMonthEvents();
    }

    renderDays(year, month, daysInMonth, startingDay, today) {
        const daysContainer = document.getElementById('calendar-days');
        daysContainer.innerHTML = '';

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            daysContainer.appendChild(emptyDay);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            
            const currentDate = new Date(year, month, day);
            const isToday = this.isSameDay(currentDate, today);
            const dayEvents = this.getEventsForDate(currentDate);
            
            if (isToday) {
                dayElement.classList.add('today');
            }
            if (dayEvents.length > 0) {
                dayElement.classList.add('has-events');
            }

            dayElement.innerHTML = `
                <div class="day-number">${day}</div>
                ${dayEvents.length > 0 ? `<div class="event-indicator">${dayEvents.length} event${dayEvents.length > 1 ? 's' : ''}</div>` : ''}
            `;

            // Add click event to show events for that day
            dayElement.addEventListener('click', () => {
                this.showDayEvents(currentDate, dayEvents);
            });

            daysContainer.appendChild(dayElement);
        }
    }

    getEventsForDate(date) {
        return this.events.filter(event => {
            const eventDate = new Date(event.date);
            return this.isSameDay(eventDate, date);
        });
    }

    getEventsForCurrentMonth() {
        const currentYear = this.currentDate.getFullYear();
        const currentMonth = this.currentDate.getMonth();
        
        return this.events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.getFullYear() === currentYear && 
                   eventDate.getMonth() === currentMonth;
        }).sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    isSameDay(date1, date2) {
        return date1.getDate() === date2.getDate() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getFullYear() === date2.getFullYear();
    }

    bindNavigation() {
        document.getElementById('prev-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });

        document.getElementById('next-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });
    }

    displayMonthEvents() {
        const monthEventsContainer = document.getElementById('month-events-list');
        const currentMonthEvents = this.getEventsForCurrentMonth();
        
        if (currentMonthEvents.length === 0) {
            monthEventsContainer.innerHTML = `
                <div class="no-events-message">
                    <p>📭 No events scheduled for ${this.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                    <p class="hint">Capture event posters or add events manually!</p>
                </div>
            `;
            return;
        }

        monthEventsContainer.innerHTML = currentMonthEvents.map(event => {
            const eventDate = new Date(event.date);
            const isToday = this.isSameDay(eventDate, new Date());
            const isPast = eventDate < new Date();
            
            return `
                <div class="month-event-item ${isPast ? 'past-event' : ''}">
                    <div class="event-date-badge ${isToday ? 'today-badge' : ''}">
                        ${isToday ? '🎯 Today' : eventDate.getDate()} 
                        ${eventDate.toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                    <div class="event-content">
                        <div class="event-title">${this.escapeHtml(event.title)}</div>
                        <div class="event-time">⏰ ${eventDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        ${event.description ? `<div class="event-description">${this.escapeHtml(event.description)}</div>` : ''}
                    </div>
                    <div class="event-actions">
                        <button class="event-action-btn edit-btn" data-id="${event.id}">✏️</button>
                        <button class="event-action-btn delete-btn" data-id="${event.id}">🗑️</button>
                        ${!isPast ? `<button class="event-action-btn reminder-btn" data-id="${event.id}">⏰</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        // Bind action buttons
        this.bindEventActions();
    }

    bindEventActions() {
        // Edit events
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const eventId = e.target.dataset.id;
                this.editEvent(eventId);
            });
        });

        // Delete events
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const eventId = e.target.dataset.id;
                this.deleteEvent(eventId);
            });
        });

        // Set reminders
        document.querySelectorAll('.reminder-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const eventId = e.target.dataset.id;
                this.setReminder(eventId);
            });
        });
    }

    showDayEvents(date, events) {
        // Create modal for day events
        const modal = document.createElement('div');
        modal.className = 'calendar-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📅 ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    ${events.length === 0 ? 
                        '<div class="no-events-day">No events scheduled for this day</div>' : 
                        events.map(event => this.createEventDetailElement(event)).join('')
                    }
                </div>
                <div class="modal-footer">
                    <button class="add-event-btn" id="add-event-to-day">➕ Add Event</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close modal
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Add event to this day
        modal.querySelector('#add-event-to-day').addEventListener('click', () => {
            this.addEventToDate(date);
            modal.remove();
        });
    }

    createEventDetailElement(event) {
        const eventDate = new Date(event.date);
        const isPast = eventDate < new Date();
        
        return `
            <div class="event-detail-item ${isPast ? 'past-event' : ''}">
                <div class="event-header">
                    <div class="event-time">${eventDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    <div class="event-source">${event.source === 'OCR' ? '📷 Camera' : '✏️ Manual'}</div>
                </div>
                <div class="event-title">${this.escapeHtml(event.title)}</div>
                ${event.description ? `<div class="event-description">${this.escapeHtml(event.description)}</div>` : ''}
                <div class="event-actions">
                    <button class="action-btn edit" data-id="${event.id}">Edit</button>
                    <button class="action-btn delete" data-id="${event.id}">Delete</button>
                    ${!isPast ? `<button class="action-btn reminder" data-id="${event.id}">Set Reminder</button>` : ''}
                </div>
            </div>
        `;
    }

    editEvent(eventId) {
        // Find the event
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;

        // Switch to events tab and populate form
        document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        
        document.querySelector('[data-view="events"]').classList.add('active');
        document.getElementById('events-view').classList.add('active');

        // Populate form with event data
        document.getElementById('event-title').value = event.title;
        document.getElementById('event-datetime').value = new Date(event.date).toISOString().slice(0, 16);
        document.getElementById('event-description').value = event.description || '';

        this.showNotification('Event loaded for editing! Update the details and save.');
    }

    deleteEvent(eventId) {
        if (confirm('Are you sure you want to delete this event?')) {
            // This would typically call a controller method
            const eventIndex = this.events.findIndex(e => e.id === eventId);
            if (eventIndex > -1) {
                this.events.splice(eventIndex, 1);
                this.renderCalendar();
                this.showNotification('Event deleted successfully!');
            }
        }
    }

    setReminder(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;

        const reminderTime = prompt('Set reminder (minutes before event):', '30');
        if (reminderTime && !isNaN(reminderTime)) {
            this.scheduleNotification(event, parseInt(reminderTime));
            this.showNotification(`Reminder set for ${reminderTime} minutes before event!`);
        }
    }

    scheduleNotification(event, minutesBefore) {
        const eventTime = new Date(event.date);
        const reminderTime = new Date(eventTime.getTime() - (minutesBefore * 60 * 1000));
        
        const now = new Date();
        const timeout = reminderTime - now;

        if (timeout > 0) {
            setTimeout(() => {
                if (Notification.permission === 'granted') {
                    new Notification('📅 Event Reminder', {
                        body: `${event.title} starts in ${minutesBefore} minutes!`,
                        icon: '/favicon-32x32.png'
                    });
                }
            }, timeout);
        }
    }

    addEventToDate(date) {
        // Switch to events tab with pre-filled date
        document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        
        document.querySelector('[data-view="events"]').classList.add('active');
        document.getElementById('events-view').classList.add('active');

        // Pre-fill the date
        document.getElementById('event-datetime').value = date.toISOString().slice(0, 16);
        document.getElementById('event-title').focus();

        this.showNotification('Date pre-filled! Add event details and save.');
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}