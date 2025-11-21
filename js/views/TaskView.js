class TaskView {
    constructor() {
        this.taskList = document.getElementById('task-list');
        this.taskTitleInput = document.getElementById('task-title');
        this.taskPrioritySelect = document.getElementById('task-priority');
        this.addTaskBtn = document.getElementById('add-task-btn');
    }

    bindAddTask(handler) {
        this.addTaskBtn.addEventListener('click', () => {
            const title = this.taskTitleInput.value;
            const priority = this.taskPrioritySelect.value;
            handler(title, priority);
            this.taskTitleInput.value = '';
        });


        this.taskTitleInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTaskBtn.click();
            }
        });
    }

    bindDeleteTask(handler) {
        this.taskList.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn')) {
                const id = e.target.dataset.id;
                handler(id);
            }
        });
    }

    bindUpdateTaskStatus(handler) {
        this.taskList.addEventListener('click', (e) => {
            if (e.target.classList.contains('status-btn')) {
                const id = e.target.dataset.id;
                const status = e.target.dataset.status;
                handler(id, status);
            }
        });
    }

    displayTasks(tasks) {
        this.taskList.innerHTML = '';
        
        if (tasks.length === 0) {
            this.taskList.innerHTML = '<p class="no-tasks">No tasks yet. Add your first task!</p>';
            return;
        }
        
        tasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = `task-item ${task.status === 'done' ? 'task-done' : ''}`;
            taskElement.innerHTML = `
                <div class="task-info">
                    <strong>${this.escapeHtml(task.title)}</strong>
                    <span class="task-priority priority-${task.priority}">${task.priority}</span>
                </div>
                <div class="task-actions">
                    <button class="status-btn" data-id="${task.id}" data-status="${task.status === 'pending' ? 'done' : 'pending'}">
                        ${task.status === 'pending' ? '✓ Done' : '↶ Undo'}
                    </button>
                    <button class="delete-btn" data-id="${task.id}">🗑 Delete</button>
                </div>
            `;
            this.taskList.appendChild(taskElement);
        });
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

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}