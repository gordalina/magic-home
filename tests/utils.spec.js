import { checksum } from '../lib/utils';

test('checksum()', () => {
  expect(typeof checksum).toBe('function');
  expect(checksum(Buffer.from([0]))).toBe(0);
  expect(checksum(Buffer.from([0x10, 0x10]))).toBe(0x20);
  expect(checksum(Buffer.from([0x10, 0xff]))).toBe(0x0f);
});
