class TaskController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        
        this.view.bindAddTask(this.handleAddTask.bind(this));
        this.view.bindDeleteTask(this.handleDeleteTask.bind(this));
        this.view.bindUpdateTaskStatus(this.handleUpdateTaskStatus.bind(this));
        
        this.view.displayTasks(this.model.getTasks());
    }

    handleAddTask(title, priority) {
        if (title.trim() === '') {
            this.view.showNotification('Task title cannot be empty', 'error');
            return;
        }
        
        this.model.addTask(title, priority);
        this.view.displayTasks(this.model.getTasks());
        this.view.showNotification('Task added successfully!');
    }

    handleDeleteTask(id) {
        this.model.deleteTask(id);
        this.view.displayTasks(this.model.getTasks());
        this.view.showNotification('Task deleted');
    }

    handleUpdateTaskStatus(id, status) {
        this.model.updateTask(id, { status });
        this.view.displayTasks(this.model.getTasks());
        this.view.showNotification(`Task marked as ${status}`);
    }
}