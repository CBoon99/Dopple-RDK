// scripts/auth.js
/**
 * Room for Improvement – Hotel Management System
 * Authentication Module
 */
const authModule = {
    currentUser: null,
    currentRole: null,
    roleHierarchy: { staff: 1, supervisor: 2, manager: 3, owner: 4 },
    dailyLimits: {
        staff: 5, // rooms per day
        supervisor: 1, // spot check per day
        manager: 0, // no daily limit for managers
        owner: 0 // no daily limit for owners
    },
    permissions: {
        staff: ['view_tasks', 'complete_tasks', 'view_schedule'],
        supervisor: ['view_tasks', 'complete_tasks', 'spot_check', 'view_schedule'],
        manager: ['view_tasks', 'view_schedule', 'view_analytics', 'view_config'],
        owner: ['all']
    },
    async init() {
        try {
            console.log('🔐 Initializing Auth...');
            const session = await this.getSecureSession();
            if (session) {
                this.currentUser = session.userId;
                this.currentRole = session.role;
            }
            RoomForImprovementSystem.modules.auth = this;
            this.updateUI();
            RoomForImprovementSystem.events.on('userLoggedIn', () => this.updateUI());
            console.log('✅ Auth initialized');
        } catch (error) {
            console.warn('❌ Auth init failed:', error);
        }
    },
    async getSecureSession() {
        try {
            const session = localStorage.getItem('user_session');
            if (!session) return null;
            const { userId, role, timestamp } = JSON.parse(session);
            // Check if session is expired (24 hours)
            if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
                this.logout();
                return null;
            }
            return { userId, role };
        } catch (error) {
            console.warn('Session retrieval failed:', error);
            return null;
        }
    },
    async login(username, password) {
        const response = await fetch('users.json');
        const users = await response.json();
        
        const user = users.find(u => u.id === username && u.password === password);
        if (!user) {
            throw new Error('Invalid credentials');
        }
        
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        return true;
    },
    async loadUsers() {
        try {
            const response = await fetch('users.json');
            const data = await response.json();
            return data.users;
        } catch (error) {
            console.warn('Failed to load users:', error);
            return [];
        }
    },
    logout() {
        this.currentUser = null;
        this.currentRole = null;
        localStorage.removeItem('user_session');
        localStorage.removeItem('currentUser');
        this.updateUI();
    },
    updateUI() {
        const loginSection = document.getElementById('login-section');
        const userDisplay = document.getElementById('user-display');
        const sections = ['rooms-section', 'tasks-section', 'schedule-section', 'config-section'];
        
        if (this.currentUser) {
            loginSection.classList.add('hidden');
            userDisplay.textContent = `${this.currentUser.id} (${this.currentUser.role})`;
            
            // Show/hide sections based on role
            sections.forEach(id => {
                const element = document.getElementById(id);
                if (!element) return;
                
                if (id === 'config-section' && this.currentUser.role !== 'owner') {
                    element.classList.add('hidden');
                } else {
                    element.classList.remove('hidden');
                }
            });
            
            RoomForImprovementSystem.updateUI();
        } else {
            loginSection.classList.remove('hidden');
            userDisplay.textContent = '';
            sections.forEach(id => {
                const element = document.getElementById(id);
                if (element) element.classList.add('hidden');
            });
        }
    },
    hasMinRole(role) {
        return this.roleHierarchy[this.currentUser.role] >= this.roleHierarchy[role];
    },
    hasPermission(permission) {
        if (!this.currentUser) return false;
        
        const rolePermissions = {
            staff: ['view_tasks', 'view_schedule'],
            supervisor: ['view_tasks', 'view_schedule', 'view_analytics'],
            manager: ['view_tasks', 'view_schedule', 'view_analytics', 'view_config'],
            owner: ['view_tasks', 'view_schedule', 'view_analytics', 'view_config', 'edit_config']
        };
        
        return rolePermissions[this.currentUser.role]?.includes(permission) || false;
    },
    getDailyLimit() {
        return this.dailyLimits[this.currentUser.role] || 0;
    },
    getState() {
        return { 
            currentUser: this.currentUser, 
            currentRole: this.currentUser.role,
            dailyLimit: this.getDailyLimit()
        };
    },
    handleQuery(query) {
        return { response: 'Auth query not supported' };
    },
    async addUser(user) {
        if (!this.hasPermission('edit_config')) {
            throw new Error('Insufficient permissions');
        }
        
        const response = await fetch('users.json');
        const users = await response.json();
        users.push(user);
        await RoomForImprovementSystem.modules.storage.saveUsers(users);
    }
};

RoomForImprovementSystem.registerModule('auth', authModule);

// Export for use in browser
if (typeof window !== 'undefined') {
    window.AuthModule = authModule;
}