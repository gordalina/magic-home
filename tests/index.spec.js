import defaultExport, * as namedExports from '../lib';

test('default export', () => {
  expect(defaultExport).toBe(undefined);
});

test('named exports', () => {
  expect(typeof namedExports).toBe('object');
  expect(typeof namedExports.Light).toBe('function');
  expect(Object.keys(namedExports).length).toBe(1);
});
