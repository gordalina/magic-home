import Patterns from '../lib/Patterns';

test('Patterns.all()', () => {
  expect(typeof Patterns.all).toBe('function');

  const patterns = Patterns.all();
  expect(typeof patterns).toBe('object');
  expect(Object.keys(patterns).length).toBe(20);
  expect(typeof Object.keys(patterns)[0]).toBe('string');
  expect(typeof Object.values(patterns)[0]).toBe('number');
});

test('Patterns.fromCode()', () => {
  expect(typeof Patterns.fromCode).toBe('function');
  expect(Patterns.fromCode(0x25)).toBe('seven_color_cross_fade');
});

test('Patterns.fromName()', () => {
  expect(typeof Patterns.fromName).toBe('function');
  expect(Patterns.fromName('seven_color_cross_fade')).toBe(0x25);
});
