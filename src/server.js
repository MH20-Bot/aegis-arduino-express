import 'dotenv/config';

import app from './app.js';

import {
  connectDatabase
} from './config/database.js';

import {
  connectArduino
} from './services/arduinoService.js';

const serverPort = Number(
  process.env.PORT || 5000
);

app.listen(serverPort, async () => {
  console.log(
    `Server running at http://localhost:${serverPort}`
  );

  connectArduino();

  await connectDatabase();
});