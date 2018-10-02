import debug from 'debug';
import Discover from './Discover';
import Transport from './Transport';
import Patterns from './Patterns';
import {
  determineMode, clamp, delayToSpeed, speedToDelay,
} from './utils';

const COMMAND_POWER_ON = [0x71, 0x23, 0x0f];
const COMMAND_POWER_OFF = [0x71, 0x24, 0x0f];
const COMMAND_QUERY_STATE = [0x81, 0x8a, 0x8b];

const COMMAND_POWER_ON_SUCCESS = [0xf0, 0x71, 0x23, 0x84];
const COMMAND_POWER_OFF_SUCCESS = [0xf0, 0x71, 0x24, 0x85];

class Light {
  constructor({ host, id, model }) {
    this.metadata = { host, id, model };
    this.transport = new Transport(host);
    this.characteristics = {
      rgb_min_0: true, // is 0 the lowest value for r/g/b? (otherwise it's 1)
      ww_min_0: true,
      wait_for_reply: true,
      set_color_magic_bytes: [0xf0, 0x0f], // could also be 0x00,0x0f or something else
    };
    this.logger = debug(`magic-home:light:${host}`);
  }

  static async scan(timeout = 500) {
    return Discover.scan(timeout);
  }

  async send(command) {
    const buffer = Buffer.from(command);
    return this.transport.send(buffer);
  }

  async release() {
    return this.transport.disconnect();
  }

  async on() {
    this.logger('Turning on');
    const result = await this.send(COMMAND_POWER_ON);
    return Buffer.compare(result, Buffer.from(COMMAND_POWER_ON_SUCCESS)) === 0;
  }

  async off() {
    this.logger('Turning off');
    const result = await this.send(COMMAND_POWER_OFF);
    return Buffer.compare(result, Buffer.from(COMMAND_POWER_OFF_SUCCESS)) === 0;
  }

  async state() {
    this.logger('Querying state');
    const data = await this.send(COMMAND_QUERY_STATE);

    if (data.length < 14) {
      throw new Error('State query returned invalid data.');
    }

    return {
      on: data.readUInt8(2) === 0x23,
      mode: determineMode(data),
      speed: delayToSpeed(data.readUInt8(5)),
      color: {
        red: data.readUInt8(6),
        green: data.readUInt8(7),
        blue: data.readUInt8(8),
      },
      warm_white_percent: (data.readUInt8(9) / 255) * 100,
    };
  }

  async color(red, green, blue) {
    const lowerBound = this.characteristics.rgb_min_0 ? 0 : 1;
    const wwValue = this.characteristics.ww_min_0 ? 0 : 0xff;

    const r = clamp(red, lowerBound, 255);
    const g = clamp(green, lowerBound, 255);
    const b = clamp(blue, lowerBound, 255);

    const [first, last] = this.characteristics.set_color_magic_bytes;
    this.logger('Setting color rgb(%o,%o,%o)', r, g, b);
    return (await this.send([0x31, r, g, b, wwValue, first, last])) === 0x30;
  }

  async brightness(red, green, blue, brightness) {
    const bright = clamp(brightness, 0, 100);

    let r = (255 / 100) * bright;
    let g = (255 / 100) * bright;
    let b = (255 / 100) * bright;

    if (red > 0 || green > 0 || blue > 0) {
      r = Math.round((clamp(red, 0, 255) / 100) * bright);
      g = Math.round((clamp(green, 0, 255) / 100) * bright);
      b = Math.round((clamp(blue, 0, 255) / 100) * bright);
    }

    this.logger(
      'Setting color with brightness rgba(%o,%o,%o,%o)',
      red,
      green,
      blue,
      bright,
    );
    return this.color(r, g, b);
  }

  async pattern(pattern, speed) {
    const code = Patterns.fromName(pattern);

    if (!code) {
      throw new Error(`No pattern found by name: ${pattern}`);
    }

    const delay = speedToDelay(speed);
    this.logger('Setting pattern %o with speed %o', pattern, speed);
    return (await this.send([0x61, code, delay, 0x0f])) === 0x30;
  }

  static patterns() {
    return Object.keys(Patterns.all());
  }
}

export default Light;
