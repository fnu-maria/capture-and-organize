class CalendarView {
    constructor() {
        this.calendarElement = document.getElementById('calendar');
    }

    displayCalendar(events) {
        this.calendarElement.innerHTML = '';
        
        if (events.length === 0) {
            this.calendarElement.innerHTML = '<p>No events scheduled yet. Capture some event posters!</p>';
            return;
        }

        const upcomingEvents = events.filter(event => new Date(event.date) >= new Date());
        const pastEvents = events.filter(event => new Date(event.date) < new Date());

        if (upcomingEvents.length > 0) {
            const upcomingSection = document.createElement('div');
            upcomingSection.innerHTML = '<h3>Upcoming Events</h3>';
            
            upcomingEvents.forEach(event => {
                const eventElement = this.createEventElement(event);
                upcomingSection.appendChild(eventElement);
            });
            
            this.calendarElement.appendChild(upcomingSection);
        }

        if (pastEvents.length > 0) {
            const pastSection = document.createElement('div');
            pastSection.innerHTML = '<h3>Past Events</h3>';
            
            pastEvents.forEach(event => {
                const eventElement = this.createEventElement(event);
                pastSection.appendChild(eventElement);
            });
            
            this.calendarElement.appendChild(pastSection);
        }
    }

    createEventElement(event) {
        const eventElement = document.createElement('div');
        eventElement.className = 'calendar-event';
        
        const eventDate = new Date(event.date);
        const now = new Date();
        const isToday = eventDate.toDateString() === now.toDateString();
        
        eventElement.innerHTML = `
            <strong>${this.escapeHtml(event.title)}</strong>
            <div>
                ${isToday ? '📅 Today' : eventDate.toLocaleDateString()} 
                at ${eventDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                ${event.source === 'OCR' ? ' 📷' : ' ✏️'}
            </div>
            ${event.description ? `<div>${this.escapeHtml(event.description)}</div>` : ''}
        `;
        
        return eventElement;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}