/* eslint no-bitwise: off, no-restricted-syntax: off */

import Patterns from './Patterns';

export function determineMode(state) {
  const pattern = state.readUInt8(3);
  const bit10 = state.readUInt8(9);

  if (pattern === 0x61) {
    if (bit10 !== 0) {
      return 'warm_white';
    }
    return 'color';
  }
  if (pattern === 0x62) {
    return 'special';
  }
  if (pattern === 0x60) {
    return 'custom';
  }
  if (pattern >= 0x25 && pattern <= 0x38) {
    return Patterns.fromCode(pattern);
  }

  return 'unknown';
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function delayToSpeed(delay) {
  let clamped = clamp(delay, 1, 31);
  clamped -= 1; // bring into interval [0, 30]
  return 100 - (clamped / 30) * 100;
}

export function speedToDelay(speed) {
  const clamped = clamp(speed, 0, 100);
  return 30 - (clamped / 100) * 30 + 1;
}

export function checksum(buffer) {
  let chk = 0;

  for (const byte of buffer) {
    chk += byte;
  }

  return chk & 0xff;
}
