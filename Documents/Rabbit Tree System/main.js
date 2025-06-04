// scripts/main.js
/**
 * Room for Improvement – Hotel Management System
 * Main Application Controller
 */
const RoomForImprovementSystem = {
    version: '1.0.0',
    buildDate: '2024-03-20',
    state: {
        initialized: false,
        currentUser: null,
        currentRole: null,
        currentLanguage: 'en',
        currentRoom: null,
        currentTask: null,
        dailyCleaningCount: 0,
        dailySpotCheckCount: 0
    },
    modules: {},
    plugins: { frontOfHouse: {}, backOfHouse: {} },
    events: {
        listeners: {},
        on(event, callback) {
            this.listeners[event] = this.listeners[event] || [];
            this.listeners[event].push(callback);
        },
        emit(event, data) {
            this.listeners[event]?.forEach(cb => {
                try {
                    cb(data);
                } catch (error) {
                    console.warn(`Error in event ${event}:`, error);
                }
            });
        }
    },
    storage: {
        set(key, value) {
            try {
                const data = { value, timestamp: Date.now(), version: RoomForImprovementSystem.version };
                localStorage.setItem(`rfi_${key}`, JSON.stringify(data));
                return true;
            } catch (error) {
                console.warn('Storage set error:', error);
                return false;
            }
        },
        get(key) {
            try {
                const item = localStorage.getItem(`rfi_${key}`);
                return item ? JSON.parse(item).value : null;
            } catch (error) {
                console.warn('Storage get error:', error);
                return null;
            }
        }
    },
    async init() {
        try {
            console.log('🏨 Initializing RFI...');
            
            // Initialize IndexedDB
            await initDB();
            await loadInitialData();
            
            // Auto-detect language
            const browserLang = navigator.language.split('-')[0];
            this.state.currentLanguage = ['en', 'id'].includes(browserLang) ? browserLang : 'en';
            
            const moduleOrder = ['auth', 'i18n', 'rooms'];
            for (const mod of moduleOrder) {
                if (this.modules[mod]) {
                    await this.modules[mod].init();
                }
            }

            // Setup UI listeners
            this.setupUIListeners();
            this.updateUI();

            this.state.initialized = true;
            this.events.emit('systemInitialized');
            console.log('✅ RFI initialized');
            return Promise.resolve();
        } catch (error) {
            console.warn('❌ RFI init failed:', error);
            return Promise.reject(error);
        }
    },
    setupUIListeners() {
        // Language toggle
        document.getElementById('language-toggle').addEventListener('click', () => this.modules.i18n.toggleLanguage());
        
        // Room selection
        document.getElementById('room-select').addEventListener('change', (e) => {
            this.state.currentRoom = e.target.value;
            if (this.state.currentRoom) {
                this.loadRoomTasks(this.state.currentRoom);
            }
        });

        // Cleaning actions
        document.getElementById('start-cleaning').addEventListener('click', () => this.startCleaning());
        document.getElementById('complete-cleaning').addEventListener('click', () => this.completeCleaning());
        
        // Spot check actions
        document.getElementById('start-spot-check').addEventListener('click', () => this.startSpotCheck());
        document.getElementById('submit-spot-check').addEventListener('click', () => this.submitSpotCheck());
        
        // Config panel actions
        document.getElementById('save-config').addEventListener('click', () => this.saveConfig());

        // Populate room select when language changes
        this.events.on('languageChanged', () => this.populateRoomSelect());
        
        // Populate spot check room select when language changes
        RoomForImprovementSystem.events.on('languageChanged', populateSpotCheckRoomSelect);
        
        // Initial population
        this.populateRoomSelect();
        this.populateSpotCheckRoomSelect();
    },
    async startCleaning() {
        try {
            const { currentUser, currentRole } = this.modules.auth.getState();
            if (currentRole !== 'staff') {
                throw new Error('Only staff can start cleaning');
            }

            const dailyLimit = this.modules.auth.getDailyLimit();
            if (this.state.dailyCleaningCount >= dailyLimit) {
                throw new Error(`Daily limit of ${dailyLimit} rooms reached`);
            }

            const roomId = this.state.currentRoom;
            if (!roomId) {
                throw new Error('No room selected');
            }

            const room = await getRoom(roomId);
            if (!room) {
                throw new Error('Room not found');
            }

            const cleaningRecord = {
                roomId,
                staffId: currentUser,
                startTime: new Date().toISOString(),
                tasks: [],
                status: 'in_progress'
            };

            const store = db.transaction('cleaningRecords', 'readwrite').objectStore('cleaningRecords');
            await store.add(cleaningRecord);

            this.state.dailyCleaningCount++;
            this.updateUI();
            this.events.emit('cleaningStarted', { roomId, staffId: currentUser });
        } catch (error) {
            console.error('Failed to start cleaning:', error);
            alert(error.message);
        }
    },
    async completeCleaning() {
        try {
            const { currentUser, currentRole } = this.modules.auth.getState();
            if (currentRole !== 'staff') {
                throw new Error('Only staff can complete cleaning');
            }

            const roomId = this.state.currentRoom;
            if (!roomId) {
                throw new Error('No room selected');
            }

            const store = db.transaction('cleaningRecords', 'readwrite').objectStore('cleaningRecords');
            const index = store.index('roomId');
            const records = await index.getAll(roomId);
            const latestRecord = records[records.length - 1];

            if (!latestRecord || latestRecord.status !== 'in_progress') {
                throw new Error('No active cleaning session found');
            }

            latestRecord.status = 'completed';
            latestRecord.endTime = new Date().toISOString();
            await store.put(latestRecord);

            this.updateUI();
            this.events.emit('cleaningCompleted', { roomId, staffId: currentUser });
        } catch (error) {
            console.error('Failed to complete cleaning:', error);
            alert(error.message);
        }
    },
    async startSpotCheck() {
        try {
            const { currentUser, currentRole } = this.modules.auth.getState();
            if (currentRole !== 'supervisor') {
                throw new Error('Only supervisors can perform spot checks');
            }

            if (this.state.dailySpotCheckCount >= 1) {
                throw new Error('Daily spot check limit reached');
            }

            const roomId = this.state.currentRoom;
            if (!roomId) {
                throw new Error('No room selected');
            }

            // Verify room was cleaned today
            const store = db.transaction('cleaningRecords', 'readonly').objectStore('cleaningRecords');
            const index = store.index('roomId');
            const records = await index.getAll(roomId);
            const latestRecord = records[records.length - 1];

            if (!latestRecord || latestRecord.status !== 'completed' || 
                new Date(latestRecord.endTime).toDateString() !== new Date().toDateString()) {
                throw new Error('Room must be cleaned today before spot check');
            }

            const spotCheck = {
                roomId,
                supervisorId: currentUser,
                startTime: new Date().toISOString(),
                status: 'in_progress'
            };

            const spotCheckStore = db.transaction('spotChecks', 'readwrite').objectStore('spotChecks');
            await spotCheckStore.add(spotCheck);

            this.state.dailySpotCheckCount++;
            this.updateUI();
            this.events.emit('spotCheckStarted', { roomId, supervisorId: currentUser });
        } catch (error) {
            console.error('Failed to start spot check:', error);
            alert(error.message);
        }
    },
    async submitSpotCheck() {
        try {
            const { currentUser, currentRole } = this.modules.auth.getState();
            if (currentRole !== 'supervisor') {
                throw new Error('Only supervisors can submit spot checks');
            }

            const roomId = this.state.currentRoom;
            if (!roomId) {
                throw new Error('No room selected');
            }

            const notes = document.getElementById('spot-check-notes').value;
            if (!notes) {
                throw new Error('Please enter spot check notes');
            }

            const store = db.transaction('spotChecks', 'readwrite').objectStore('spotChecks');
            const index = store.index('roomId');
            const records = await index.getAll(roomId);
            const latestRecord = records[records.length - 1];

            if (!latestRecord || latestRecord.status !== 'in_progress') {
                throw new Error('No active spot check session found');
            }

            latestRecord.status = 'completed';
            latestRecord.endTime = new Date().toISOString();
            latestRecord.notes = notes;
            await store.put(latestRecord);

            this.updateUI();
            this.events.emit('spotCheckCompleted', { roomId, supervisorId: currentUser });
        } catch (error) {
            console.error('Failed to submit spot check:', error);
            alert(error.message);
        }
    },
    async loadRoomTasks(roomId) {
        try {
            const tasks = await getAllTasks();
            const taskList = document.getElementById('task-list');
            taskList.innerHTML = '';

            tasks.forEach(task => {
                const taskItem = document.createElement('div');
                taskItem.className = 'task-item';
                taskItem.innerHTML = `
                    <input type="checkbox" id="task-${task.id}" data-task-id="${task.id}">
                    <label for="task-${task.id}">${task[`name_${this.state.currentLanguage}`]}</label>
                    <span class="task-timestamp"></span>
                `;
                taskList.appendChild(taskItem);
            });

            // Load latest cleaning record
            const latestRecord = await getLatestCleaningRecord(roomId);
            if (latestRecord) {
                latestRecord.tasks.forEach(task => {
                    const checkbox = document.getElementById(`task-${task.id}`);
                    if (checkbox) {
                        checkbox.checked = true;
                        checkbox.nextElementSibling.nextElementSibling.textContent = 
                            new Date(task.completedAt).toLocaleTimeString();
                    }
                });
            }
        } catch (error) {
            console.error('Failed to load room tasks:', error);
        }
    },
    updateUI() {
        const { currentRole } = this.modules.auth.getState();
        
        // Update language toggle
        document.getElementById('language-toggle').textContent = this.state.currentLanguage.toUpperCase();
        
        // Update role-specific UI elements
        document.getElementById('staff-controls').classList.toggle('hidden', currentRole !== 'staff');
        document.getElementById('supervisor-controls').classList.toggle('hidden', currentRole !== 'supervisor');
        document.getElementById('manager-controls').classList.toggle('hidden', currentRole !== 'manager');
        document.getElementById('owner-controls').classList.toggle('hidden', currentRole !== 'owner');
        
        // Update daily counts
        if (currentRole === 'staff') {
            document.getElementById('daily-count').textContent = 
                `${this.state.dailyCleaningCount}/${this.modules.auth.getDailyLimit()}`;
        } else if (currentRole === 'supervisor') {
            document.getElementById('daily-count').textContent = 
                `${this.state.dailySpotCheckCount}/1`;
        }
        
        // Update analytics if manager or owner
        if (currentRole === 'manager' || currentRole === 'owner') {
            this.updateAnalytics();
        }
    },
    registerModule(name, module) {
        this.modules[name] = module;
        if (this.state.initialized && module.init) {
            module.init();
        }
    },
    registerPlugin(category, name, plugin) {
        this.plugins[category][name] = plugin;
        if (this.state.initialized && plugin.init) {
            plugin.init();
        }
    },
    async populateRoomSelect() {
        const roomSelect = document.getElementById('room-select');
        const { currentLanguage } = this.state;
        
        try {
            const rooms = await this.modules.rooms.getAvailableRooms();
            roomSelect.innerHTML = '<option value="">Choose a room...</option>';
            
            rooms.forEach(room => {
                const option = document.createElement('option');
                option.value = room.id;
                option.textContent = room[`name_${currentLanguage}`];
                roomSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Failed to populate room select:', error);
        }
    },
    async populateSpotCheckRoomSelect() {
        const spotCheckRoomSelect = document.getElementById('spot-check-room');
        const { currentLanguage } = this.state;
        
        try {
            const rooms = await this.modules.rooms.getCleanedRooms();
            spotCheckRoomSelect.innerHTML = '<option value="">Choose a room...</option>';
            
            rooms.forEach(room => {
                const option = document.createElement('option');
                option.value = room.id;
                option.textContent = room[`name_${currentLanguage}`];
                spotCheckRoomSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Failed to populate spot check room select:', error);
        }
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => RoomForImprovementSystem.init());
} else {
    RoomForImprovementSystem.init();
}

// Initialize IndexedDB
const dbName = 'rabbitTreeDB';
const dbVersion = 1;
let db;

const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, dbVersion);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Create object stores
            if (!db.objectStoreNames.contains('rooms')) {
                const roomStore = db.createObjectStore('rooms', { keyPath: 'id' });
                roomStore.createIndex('id', 'id', { unique: true });
            }
            if (!db.objectStoreNames.contains('tasks')) {
                const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
                taskStore.createIndex('id', 'id', { unique: true });
            }
            if (!db.objectStoreNames.contains('cleaningRecords')) {
                const cleaningStore = db.createObjectStore('cleaningRecords', { keyPath: 'id', autoIncrement: true });
                cleaningStore.createIndex('roomId', 'roomId', { unique: false });
                cleaningStore.createIndex('staffId', 'staffId', { unique: false });
            }
            if (!db.objectStoreNames.contains('spotChecks')) {
                const spotCheckStore = db.createObjectStore('spotChecks', { keyPath: 'id', autoIncrement: true });
                spotCheckStore.createIndex('roomId', 'roomId', { unique: false });
                spotCheckStore.createIndex('supervisorId', 'supervisorId', { unique: false });
            }
            if (!db.objectStoreNames.contains('settings')) {
                const settingsStore = db.createObjectStore('settings', { keyPath: 'key' });
                settingsStore.createIndex('key', 'key', { unique: true });
            }
        };
    });
};

// Load initial data
const loadInitialData = async () => {
    try {
        // Load rooms
        const roomsResponse = await fetch('rooms.json');
        const roomsData = await roomsResponse.json();
        const roomsStore = db.transaction('rooms', 'readwrite').objectStore('rooms');
        for (const room of roomsData.rooms) {
            await roomsStore.put(room);
        }

        // Load tasks
        const tasksResponse = await fetch('tasks.json');
        const tasksData = await tasksResponse.json();
        const tasksStore = db.transaction('tasks', 'readwrite').objectStore('tasks');
        for (const task of tasksData.tasks) {
            await tasksStore.put(task);
        }

        // Set default settings
        const settingsStore = db.transaction('settings', 'readwrite').objectStore('settings');
        await settingsStore.put({ key: 'maxRoomsPerStaff', value: 5 });
        await settingsStore.put({ key: 'spotCheckTime', value: '12:00' });
    } catch (error) {
        console.error('Error loading initial data:', error);
    }
};

// Helper functions
const getRoom = async (roomId) => {
    const store = db.transaction('rooms', 'readonly').objectStore('rooms');
    return await store.get(roomId);
};

const getAllTasks = async () => {
    const store = db.transaction('tasks', 'readonly').objectStore('tasks');
    return await store.getAll();
};

const getLatestCleaningRecord = async (roomId) => {
    const store = db.transaction('cleaningRecords', 'readonly').objectStore('cleaningRecords');
    const index = store.index('roomId');
    const records = await index.getAll(roomId);
    return records[records.length - 1];
};

// Configuration Functions
const loadConfig = async () => {
    const settingsStore = db.transaction('settings', 'readonly').objectStore('settings');
    const maxRooms = await settingsStore.get('maxRoomsPerStaff');
    const spotCheckTime = await settingsStore.get('spotCheckTime');

    document.getElementById('max-rooms-per-staff').value = maxRooms.value;
    document.getElementById('spot-check-time').value = spotCheckTime.value;
};

const saveConfig = async () => {
    const settingsStore = db.transaction('settings', 'readwrite').objectStore('settings');
    
    await settingsStore.put({
        key: 'maxRoomsPerStaff',
        value: parseInt(document.getElementById('max-rooms-per-staff').value)
    });
    
    await settingsStore.put({
        key: 'spotCheckTime',
        value: document.getElementById('spot-check-time').value
    });
};

// Analytics Functions
const getAnalytics = async () => {
    try {
        const today = new Date().toDateString();
        
        // Get cleaning records
        const cleaningStore = db.transaction('cleaningRecords', 'readonly').objectStore('cleaningRecords');
        const cleaningRecords = await cleaningStore.getAll();
        
        // Get spot check records
        const spotCheckStore = db.transaction('spotChecks', 'readonly').objectStore('spotChecks');
        const spotCheckRecords = await spotCheckStore.getAll();
        
        // Filter today's records
        const todayCleanings = cleaningRecords.filter(record => 
            new Date(record.endTime).toDateString() === today && record.status === 'completed'
        );
        
        const todaySpotChecks = spotCheckRecords.filter(record => 
            new Date(record.endTime).toDateString() === today && record.status === 'completed'
        );
        
        // Calculate staff performance
        const staffPerformance = {};
        todayCleanings.forEach(record => {
            if (!staffPerformance[record.staffId]) {
                staffPerformance[record.staffId] = {
                    roomsCleaned: 0,
                    averageTime: 0,
                    totalTime: 0
                };
            }
            staffPerformance[record.staffId].roomsCleaned++;
            const cleaningTime = new Date(record.endTime) - new Date(record.startTime);
            staffPerformance[record.staffId].totalTime += cleaningTime;
            staffPerformance[record.staffId].averageTime = 
                staffPerformance[record.staffId].totalTime / staffPerformance[record.staffId].roomsCleaned;
        });
        
        return {
            roomsCleanedToday: todayCleanings.length,
            spotChecksCompleted: todaySpotChecks.length,
            staffPerformance
        };
    } catch (error) {
        console.error('Failed to get analytics:', error);
        return null;
    }
};

// Update analytics display
const updateAnalytics = async () => {
    const analytics = await getAnalytics();
    if (!analytics) return;
    
    const analyticsSection = document.getElementById('analytics-section');
    if (!analyticsSection) return;
    
    analyticsSection.innerHTML = `
        <div class="dashboard-card">
            <h3>Today's Overview</h3>
            <p>Rooms Cleaned: ${analytics.roomsCleanedToday}</p>
            <p>Spot Checks Completed: ${analytics.spotChecksCompleted}</p>
        </div>
        <div class="dashboard-card">
            <h3>Staff Performance</h3>
            ${Object.entries(analytics.staffPerformance).map(([staffId, stats]) => `
                <div class="staff-stats">
                    <p>${staffId}</p>
                    <p>Rooms: ${stats.roomsCleaned}</p>
                    <p>Avg Time: ${Math.round(stats.averageTime / 60000)} minutes</p>
                </div>
            `).join('')}
        </div>
    `;
};

// Add analytics section to owner controls
document.getElementById('owner-controls').insertAdjacentHTML('beforeend', `
    <div id="analytics-section" class="dashboard-card">
        <h3>Analytics</h3>
        <div class="analytics-content"></div>
    </div>
`);

// Update analytics when cleaning or spot check is completed
RoomForImprovementSystem.events.on('cleaningCompleted', updateAnalytics);
RoomForImprovementSystem.events.on('spotCheckCompleted', updateAnalytics);

// After all module definitions and registrations:
RoomForImprovementSystem.modules = {
  auth: window.AuthModule,
  rooms: window.RoomsModule,
  tasks: window.TasksModule,
  storage: window.StorageModule,
  i18n: window.I18nModule
};