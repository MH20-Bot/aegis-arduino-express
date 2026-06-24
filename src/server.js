```js
import 'dotenv/config';

import app from './app.js';

import {
  connectDatabase
} from './config/database.js';

import {
  connectArduino
} from './services/arduinoService.js';

const serverPort =
  Number(
    process.env.PORT ||
    5000
  );

const serverHost =
  process.env.HOST ||
  '0.0.0.0';

const arduinoEnabled =
  process.env.ENABLE_ARDUINO ===
  'true';

app.listen(
  serverPort,
  serverHost,
  async () => {
    console.log(
      `Server running on ${serverHost}:${serverPort}`
    );

    if (arduinoEnabled) {
      try {
        connectArduino();
      } catch (error) {
        console.error(
          'Arduino connection failed:',
          error.message
        );
      }
    } else {
      console.log(
        'Arduino connection is disabled for this environment.'
      );
    }

    try {
      await connectDatabase();
    } catch (error) {
      console.error(
        'Database startup error:',
        error.message
      );
    }
  }
);
```
