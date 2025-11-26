class EventModel {
    constructor() {
        this.events = this.loadEvents();
    }

    loadEvents() {
        const events = localStorage.getItem('events');
        return events ? JSON.parse(events) : [];
    }

    saveEvents() {
        localStorage.setItem('events', JSON.stringify(this.events));
    }

    addEvent(title, date, description = '', image = null, source = 'manual') {
        const event = {
            id: this.generateId(),
            title,
            date,
            description,
            image,
            source,
            createdAt: new Date().toISOString()
        };
        
        this.events.push(event);
        this.saveEvents();
        return event;
    }

    deleteEvent(id) {
        this.events = this.events.filter(event => event.id !== id);
        this.saveEvents();
    }

	getEvents() {
		return this.events.sort((a, b) => new Date(a.date) - new Date(b.date));
	}

	getUpcomingEvents() {
		const now = new Date();
		return this.getEvents().filter(event => new Date(event.date) >= now);
	}

    clearAllEvents() {
        this.events = [];
        this.saveEvents();
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}