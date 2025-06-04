// Test Runner Script
const TestRunner = {
    async runStaffTest() {
        TestLogger.startTest('Staff Cleaning Flow');
        
        try {
            // 1. Login as staff6
            TestLogger.logStep('Login as staff6', 'running');
            await RoomForImprovementSystem.modules.auth.login('staff6', 'changeme');
            TestLogger.logStep('Login as staff6', 'pass');
            
            // 2. Verify room limit
            TestLogger.logStep('Verify room limit', 'running');
            const rooms = await RoomForImprovementSystem.modules.rooms.getAvailableRooms();
            if (rooms.length !== 5) {
                throw new Error(`Expected 5 rooms, got ${rooms.length}`);
            }
            TestLogger.logStep('Verify room limit', 'pass', `Found ${rooms.length} rooms`);
            
            // 3. Clean each room
            for (let i = 0; i < 5; i++) {
                const roomId = rooms[i].id;
                TestLogger.logStep(`Clean room ${roomId}`, 'running');
                
                // Start cleaning
                await RoomForImprovementSystem.startCleaning(roomId);
                
                // Complete tasks
                const tasks = await RoomForImprovementSystem.modules.tasks.getTasks();
                for (const task of tasks) {
                    await RoomForImprovementSystem.completeTask(task.id);
                    TestLogger.logStep(`Complete task ${task.id}`, 'pass');
                }
                
                // Complete cleaning
                await RoomForImprovementSystem.completeCleaning();
                TestLogger.logStep(`Clean room ${roomId}`, 'pass');
            }
            
            // 4. Try to clean 6th room
            TestLogger.logStep('Attempt to clean 6th room', 'running');
            try {
                await RoomForImprovementSystem.startCleaning('106');
                TestLogger.logStep('Attempt to clean 6th room', 'fail', 'Should have been blocked');
            } catch (error) {
                TestLogger.logStep('Attempt to clean 6th room', 'pass', 'Successfully blocked');
            }
            
            // 5. Verify data storage
            TestLogger.logStep('Verify cleaning records', 'running');
            const records = await RoomForImprovementSystem.modules.storage.getCleaningRecords();
            if (records.length !== 5) {
                throw new Error(`Expected 5 cleaning records, got ${records.length}`);
            }
            TestLogger.logStep('Verify cleaning records', 'pass', `Found ${records.length} records`);
            
        } catch (error) {
            TestLogger.logStep('Test failed', 'fail', error.message);
        }
        
        TestLogger.endTest();
    },
    
    async runSupervisorTest() {
        TestLogger.startTest('Supervisor Spot Check Flow');
        
        try {
            // 1. Logout and login as sup2
            TestLogger.logStep('Logout and login as sup2', 'running');
            await RoomForImprovementSystem.modules.auth.logout();
            await RoomForImprovementSystem.modules.auth.login('sup2', 'changeme');
            TestLogger.logStep('Logout and login as sup2', 'pass');
            
            // 2. Verify cleaned rooms
            TestLogger.logStep('Verify cleaned rooms', 'running');
            const cleanedRooms = await RoomForImprovementSystem.modules.rooms.getCleanedRooms();
            if (cleanedRooms.length !== 5) {
                throw new Error(`Expected 5 cleaned rooms, got ${cleanedRooms.length}`);
            }
            TestLogger.logStep('Verify cleaned rooms', 'pass', `Found ${cleanedRooms.length} cleaned rooms`);
            
            // 3. Perform spot check
            const roomId = cleanedRooms[0].id;
            TestLogger.logStep(`Perform spot check on room ${roomId}`, 'running');
            await RoomForImprovementSystem.startSpotCheck(roomId);
            await RoomForImprovementSystem.submitSpotCheck('All tasks completed properly');
            TestLogger.logStep(`Perform spot check on room ${roomId}`, 'pass');
            
            // 4. Try second spot check
            TestLogger.logStep('Attempt second spot check', 'running');
            try {
                await RoomForImprovementSystem.startSpotCheck(cleanedRooms[1].id);
                TestLogger.logStep('Attempt second spot check', 'fail', 'Should have been blocked');
            } catch (error) {
                TestLogger.logStep('Attempt second spot check', 'pass', 'Successfully blocked');
            }
            
            // 5. Verify spot check data
            TestLogger.logStep('Verify spot check records', 'running');
            const records = await RoomForImprovementSystem.modules.storage.getSpotCheckRecords();
            if (records.length !== 1) {
                throw new Error(`Expected 1 spot check record, got ${records.length}`);
            }
            TestLogger.logStep('Verify spot check records', 'pass', `Found ${records.length} records`);
            
        } catch (error) {
            TestLogger.logStep('Test failed', 'fail', error.message);
        }
        
        TestLogger.endTest();
    },
    
    async runManagerTest() {
        TestLogger.startTest('Manager Analytics Flow');
        
        try {
            // 1. Login as manager
            TestLogger.logStep('Login as manager1', 'running');
            await RoomForImprovementSystem.modules.auth.logout();
            await RoomForImprovementSystem.modules.auth.login('manager1', 'changeme');
            TestLogger.logStep('Login as manager1', 'pass');
            
            // 2. Verify analytics access
            TestLogger.logStep('Verify analytics dashboard', 'running');
            const analytics = await RoomForImprovementSystem.getAnalytics();
            if (!analytics) {
                throw new Error('Analytics data not available');
            }
            TestLogger.logStep('Verify analytics dashboard', 'pass');
            
            // 3. Verify read-only config access
            TestLogger.logStep('Verify config access', 'running');
            const hasConfigAccess = RoomForImprovementSystem.modules.auth.hasPermission('view_config');
            if (!hasConfigAccess) {
                throw new Error('Manager should have read-only config access');
            }
            TestLogger.logStep('Verify config access', 'pass');
            
            // 4. Verify language toggle
            TestLogger.logStep('Verify language toggle', 'running');
            await RoomForImprovementSystem.modules.i18n.setLanguage('id');
            await RoomForImprovementSystem.modules.i18n.setLanguage('en');
            TestLogger.logStep('Verify language toggle', 'pass');
            
        } catch (error) {
            TestLogger.logStep('Test failed', 'fail', error.message);
        }
        
        TestLogger.endTest();
    },
    
    async runOwnerTest() {
        TestLogger.startTest('Owner Config Flow');
        
        try {
            // 1. Login as owner
            TestLogger.logStep('Login as owner1', 'running');
            await RoomForImprovementSystem.modules.auth.logout();
            await RoomForImprovementSystem.modules.auth.login('owner1', 'changeme');
            TestLogger.logStep('Login as owner1', 'pass');
            
            // 2. Add new room
            TestLogger.logStep('Add new room', 'running');
            const newRoom = {
                id: '109',
                name_en: 'Room 109',
                name_id: 'Kamar 109'
            };
            await RoomForImprovementSystem.modules.rooms.addRoom(newRoom);
            TestLogger.logStep('Add new room', 'pass');
            
            // 3. Add new task
            TestLogger.logStep('Add new task', 'running');
            const newTask = {
                id: 'windows',
                name_en: 'Clean windows',
                name_id: 'Membersihkan jendela',
                required: false
            };
            await RoomForImprovementSystem.modules.tasks.addTask(newTask);
            TestLogger.logStep('Add new task', 'pass');
            
            // 4. Add new user
            TestLogger.logStep('Add new user', 'running');
            const newUser = {
                id: 'staff7',
                role: 'staff',
                name: 'Staff Seven',
                password: 'changeme',
                created_at: new Date().toISOString()
            };
            await RoomForImprovementSystem.modules.auth.addUser(newUser);
            TestLogger.logStep('Add new user', 'pass');
            
            // 5. Verify user can login
            TestLogger.logStep('Verify new user login', 'running');
            await RoomForImprovementSystem.modules.auth.logout();
            const loginSuccess = await RoomForImprovementSystem.modules.auth.login('staff7', 'changeme');
            if (!loginSuccess) {
                throw new Error('New user could not login');
            }
            TestLogger.logStep('Verify new user login', 'pass');
            
            // 6. Toggle language
            TestLogger.logStep('Toggle language to ID', 'running');
            await RoomForImprovementSystem.modules.i18n.setLanguage('id');
            TestLogger.logStep('Toggle language to ID', 'pass');
            
            TestLogger.logStep('Toggle language to EN', 'running');
            await RoomForImprovementSystem.modules.i18n.setLanguage('en');
            TestLogger.logStep('Toggle language to EN', 'pass');
            
        } catch (error) {
            TestLogger.logStep('Test failed', 'fail', error.message);
        }
        
        TestLogger.endTest();
    },
    
    async runAllTests() {
        console.log('🚀 Starting Test Protocol');
        
        await this.runStaffTest();
        await this.runSupervisorTest();
        await this.runManagerTest();
        await this.runOwnerTest();
        
        const results = TestLogger.getResults();
        console.log('\n📊 Test Results Summary:');
        console.log(`Total Tests: ${results.totalTests}`);
        console.log(`Passed: ${results.passedTests}`);
        console.log(`Failed: ${results.failedTests}`);
        
        if (results.failedTests > 0) {
            console.log('\n❌ Failed Tests:');
            results.logs
                .filter(l => l.status === 'fail')
                .forEach(l => {
                    console.log(`\nTest: ${l.test}`);
                    l.steps
                        .filter(s => s.status === 'fail')
                        .forEach(s => console.log(`  - ${s.step}: ${s.details}`));
                });
        }
    }
};

// Export for use in browser
if (typeof window !== 'undefined') {
    window.TestRunner = TestRunner;
} 