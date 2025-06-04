describe('RoomForImprovementSystem', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        console.warn.mockRestore();
    });

    test('initializes without errors', async () => {
        expect(RoomForImprovementSystem.state.initialized).toBe(false);
        await RoomForImprovementSystem.init();
        expect(RoomForImprovementSystem.state.initialized).toBe(true);
    });

    test('registers modules', () => {
        const mockModule = { init: jest.fn() };
        RoomForImprovementSystem.registerModule('test', mockModule);
        expect(RoomForImprovementSystem.modules.test).toBe(mockModule);
    });

    test('registers plugins', () => {
        const mockPlugin = { init: jest.fn() };
        RoomForImprovementSystem.registerPlugin('backOfHouse', 'testPlugin', mockPlugin);
        expect(RoomForImprovementSystem.plugins.backOfHouse.testPlugin).toBe(mockPlugin);
    });

    test('stores and retrieves data from localStorage', () => {
        RoomForImprovementSystem.storage.set('test_key', { foo: 'bar' });
        expect(RoomForImprovementSystem.storage.get('test_key')).toEqual({ foo: 'bar' });
    });

    test('emits and listens to events', () => {
        const callback = jest.fn();
        RoomForImprovementSystem.events.on('testEvent', callback);
        RoomForImprovementSystem.events.emit('testEvent', { data: 'test' });
        expect(callback).toHaveBeenCalledWith({ data: 'test' });
    });
});