// Tasks Module
const TasksModule = {
    async getTasks() {
        const response = await fetch('tasks.json');
        return await response.json();
    },
    
    async addTask(task) {
        const tasks = await this.getTasks();
        tasks.push(task);
        await RoomForImprovementSystem.modules.storage.saveTasks(tasks);
    }
};

// Export for use in browser
if (typeof window !== 'undefined') {
    window.TasksModule = TasksModule;
} 