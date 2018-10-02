import net from 'net';
import debug from 'debug';
import Queue from 'promise-queue';
import { checksum } from './utils';

const PORT = 5577;

function wait(emitter, eventName) {
  return new Promise((resolve, reject) => {
    let off;
    const eventHandler = (...args) => {
      off();
      resolve(...args);
    };
    const errorHandler = (e) => {
      off();
      reject(e);
    };

    off = () => {
      emitter.removeListener('error', errorHandler);
      emitter.removeListener(eventName, eventHandler);
    };

    emitter.on('error', errorHandler);
    emitter.on(eventName, eventHandler);
  });
}

class Transport {
  /**
   * @param {string} host - hostname
   * @param {number} timeout - connection timeout (in seconds)
   */
  constructor(host, timeout = 5) {
    this.host = host;
    this.timeout = timeout;

    this.socket = null;
    this.queue = null;
    this.logger = debug('magic-home:transport');
    this.queue = new Queue(1, Infinity); // 1 concurrent, infinit size
  }

  async connect(fn) {
    const options = {
      host: this.host,
      port: PORT,
      timeout: this.timeout,
    };

    this.logger('Attempting connection to %o', options);
    this.socket = net.connect(options);

    await wait(this.socket, 'connect');
    const result = await fn();
    await this.disconnect();

    return result;
  }

  disconnect() {
    this.logger('Disconnecting');
    this.socket.end();
    this.socket = null;
  }

  async send(buffer) {
    return this.queue.add(async () => (
      this.connect(async () => {
        await this.write(buffer);
        return this.read();
      })
    ));
  }

  async write(buffer) {
    const chk = checksum(buffer);
    const payload = Buffer.concat([buffer, Buffer.from([chk])]);

    this.logger('Sending command %o', `0x${payload.toString('hex')}`);
    const sent = this.socket.write(payload, 'binary');

    // wait for drain event which means all data has been sent
    if (sent !== true) {
      await wait(this.socket, 'drain');
    }
  }

  async read() {
    const data = await wait(this.socket, 'data');
    this.logger('Read data %o', `0x${data.toString('hex')}`);
    return data;
  }
}

export default Transport;
