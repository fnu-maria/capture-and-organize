class TaskModel {
    constructor() {
        this.tasks = this.loadTasks();
    }

    loadTasks() {
        const tasks = localStorage.getItem('tasks');
        return tasks ? JSON.parse(tasks) : [];
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    addTask(title, priority = 'medium') {
        const task = {
            id: this.generateId(),
            title,
            priority,
            status: 'pending',
            dateCreated: new Date().toISOString(),
            dueDate: null
        };
        
        this.tasks.push(task);
        this.saveTasks();
        return task;
    }

    updateTask(id, updates) {
        const taskIndex = this.tasks.findIndex(task => task.id === id);
        if (taskIndex !== -1) {
            this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...updates };
            this.saveTasks();
            return this.tasks[taskIndex];
        }
        return null;
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveTasks();
    }

    getTasks() {
        return this.tasks;
    }

    clearAllTasks() {
        this.tasks = [];
        this.saveTasks();
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}