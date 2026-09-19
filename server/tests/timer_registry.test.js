const { TimerRegistry } = require('../timerRegistry');

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test('clearTimer cancels and removes the registered deadline', () => {
  const callback = jest.fn();
  const registry = new TimerRegistry();
  registry.set('room-1', setTimeout(callback, 1000));

  expect(registry.clearTimer('room-1')).toBe(true);
  expect(registry.has('room-1')).toBe(false);
  jest.advanceTimersByTime(1000);
  expect(callback).not.toHaveBeenCalled();
});

test('the registry keeps normal Map identity checks for active callbacks', () => {
  const registry = new TimerRegistry();
  const timer = setTimeout(() => {}, 1000);
  registry.set('room-1', timer);

  expect(registry.get('room-1')).toBe(timer);
  expect(registry.clearTimer('missing')).toBe(false);
  registry.clearTimer('room-1');
});
