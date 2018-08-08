# Magic Home

## Install

```bash
npm install @gordalina/magic-home --save
# or
yarn add @gordalina/magic-home
```

## API

```js
import { Light } from '@gordalina/magic-home'

// this will scan the local network for lights
const devices = await Light.scan();

// this will establish network connection to the light
const light = new Light(devices[0]);

// light methods
await light.on();
await light.off();
await light.color(0xFF, 0, 0); // red
await light.brightness(0xFF, 0, 0, 50); // red with 50% brightness
await light.pattern('red_green_cross_fade', 1);
const patterns = light.patterns();
const state = await light.state();

// this will close the network connection to the light
await light.release();
```

## Debug

You can enable debug environment variable to see what's happening under the hood
by setting the `DEBUG` environment variable: 

```
DEBUG=magic-home:*
```
