import dgram from 'dgram';
import debug from 'debug';

const BROADCAST_ADDR = '255.255.255.255';
const BROADCAST_PORT = 48899;
const BROADCAST_MAGIC_STRING = 'HF-A11ASSISTHREAD';

class Discovery {
  static scan(timeout = 500) {
    const logger = debug('magic-home:discover');

    return new Promise((resolve, reject) => {
      const clients = [];
      const socket = dgram.createSocket('udp4');

      socket.on('error', (err) => {
        socket.close();
        reject(err);
      });

      socket.on('message', (msg) => {
        logger('received message %j', msg.toString());

        const parts = msg.toString().split(',');

        if (parts.length !== 3) {
          return;
        }

        const [host, id, model] = parts;
        clients.push({ host, id, model });
      });

      socket.on('listening', () => {
        socket.setBroadcast(true);
        socket.send(BROADCAST_MAGIC_STRING, BROADCAST_PORT, BROADCAST_ADDR);
      });

      socket.bind(BROADCAST_PORT);

      setTimeout(() => {
        socket.close();
        resolve(clients);
      }, timeout);
    });
  }
}

export default Discovery;
