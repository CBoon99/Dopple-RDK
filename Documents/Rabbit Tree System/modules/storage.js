// Storage Module
const StorageModule = {
    async getCleaningRecords() {
        const records = localStorage.getItem('cleaningRecords');
        return records ? JSON.parse(records) : [];
    },
    
    async getSpotCheckRecords() {
        const records = localStorage.getItem('spotCheckRecords');
        return records ? JSON.parse(records) : [];
    },
    
    async saveCleaningRecord(record) {
        const records = await this.getCleaningRecords();
        records.push({
            ...record,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('cleaningRecords', JSON.stringify(records));
    },
    
    async saveSpotCheckRecord(record) {
        const records = await this.getSpotCheckRecords();
        records.push({
            ...record,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('spotCheckRecords', JSON.stringify(records));
    },
    
    async saveRooms(rooms) {
        localStorage.setItem('rooms', JSON.stringify(rooms));
    },
    
    async saveTasks(tasks) {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
};

// Export for use in browser
if (typeof window !== 'undefined') {
    window.StorageModule = StorageModule;
} 