// Rooms Module
const RoomsModule = {
    async getAvailableRooms() {
        const rooms = await this.getRooms();
        return rooms.slice(0, 5); // Limit to 5 rooms
    },
    
    async getCleanedRooms() {
        const records = await RoomForImprovementSystem.modules.storage.getCleaningRecords();
        const rooms = await this.getRooms();
        return rooms.filter(room => 
            records.some(record => record.roomId === room.id)
        );
    },
    
    async getRooms() {
        const response = await fetch('rooms.json');
        return await response.json();
    },
    
    async addRoom(room) {
        const rooms = await this.getRooms();
        rooms.push(room);
        await RoomForImprovementSystem.modules.storage.saveRooms(rooms);
    }
};

// Export for use in browser
if (typeof window !== 'undefined') {
    window.RoomsModule = RoomsModule;
} 