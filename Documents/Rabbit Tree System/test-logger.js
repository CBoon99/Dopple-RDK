// Test Logger Module
const TestLogger = {
    currentTest: null,
    logs: [],
    
    startTest(testName) {
        this.currentTest = {
            name: testName,
            steps: [],
            status: 'running'
        };
        console.log(`\n🧪 Starting test: ${testName}`);
    },
    
    logStep(step, status, details = '') {
        if (!this.currentTest) {
            throw new Error('No test in progress');
        }
        
        const stepLog = {
            step,
            status,
            details,
            timestamp: new Date().toISOString()
        };
        
        this.currentTest.steps.push(stepLog);
        
        const statusEmoji = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '🔄';
        console.log(`${statusEmoji} ${step}${details ? `: ${details}` : ''}`);
        
        if (status === 'fail') {
            this.currentTest.status = 'fail';
        }
    },
    
    endTest() {
        if (!this.currentTest) {
            throw new Error('No test in progress');
        }
        
        this.logs.push(this.currentTest);
        
        const statusEmoji = this.currentTest.status === 'pass' ? '✅' : '❌';
        console.log(`\n${statusEmoji} Test completed: ${this.currentTest.name}`);
        
        this.currentTest = null;
    },
    
    getResults() {
        const totalTests = this.logs.length;
        const passedTests = this.logs.filter(t => t.status === 'pass').length;
        const failedTests = totalTests - passedTests;
        
        return {
            totalTests,
            passedTests,
            failedTests,
            logs: this.logs
        };
    },
    
    clear() {
        this.currentTest = null;
        this.logs = [];
    }
};

// Export for use in browser
if (typeof window !== 'undefined') {
    window.TestLogger = TestLogger;
} 