import {
  ReadlineParser,
  SerialPort
} from 'serialport';

const arduinoPort =
  process.env.ARDUINO_PORT || 'COM3';

const arduinoBaudRate = Number(
  process.env.ARDUINO_BAUD_RATE || 9600
);

let serialPort = null;
let serialParser = null;

let connectionStatus = 'disconnected';
let arduinoReady = false;
let currentAlertLevel = 'OFF';
let lastArduinoMessage = null;

const messageListeners = new Set();

function notifyMessageListeners(message) {
  for (const listener of messageListeners) {
    try {
      listener(message);
    } catch (error) {
      console.error(
        'Arduino message listener failed:',
        error.message
      );
    }
  }
}

function messageMatchesCommand(
  command,
  message
) {
  if (!message) {
    return false;
  }

  if (
    command === 'PING' &&
    message.event === 'PONG'
  ) {
    return true;
  }

  if (
    command === 'STATUS' &&
    message.event === 'STATUS'
  ) {
    return true;
  }

  return (
    message.event === 'ALERT_CHANGED' &&
    message.level === command
  );
}

export function connectArduino() {
  if (
    serialPort &&
    serialPort.isOpen
  ) {
    return;
  }

  serialPort = new SerialPort({
    path: arduinoPort,
    baudRate: arduinoBaudRate,
    autoOpen: false
  });

  serialParser = serialPort.pipe(
    new ReadlineParser({
      delimiter: '\n'
    })
  );

  serialPort.on('open', () => {
    connectionStatus = 'connected';
    arduinoReady = false;

    console.log(
      `Arduino serial port opened on ${arduinoPort}`
    );

    setTimeout(() => {
      arduinoReady = true;

      sendArduinoCommand('PING').catch(
        error => {
          console.error(
            'Arduino PING failed:',
            error.message
          );
        }
      );
    }, 2000);
  });

  serialPort.on('close', () => {
    connectionStatus = 'disconnected';
    arduinoReady = false;

    console.log(
      'Arduino serial port closed.'
    );
  });

  serialPort.on('error', error => {
    connectionStatus = 'error';
    arduinoReady = false;

    console.error(
      'Arduino serial error:',
      error.message
    );
  });

  serialParser.on('data', rawMessage => {
    const message = rawMessage.trim();

    if (!message) {
      return;
    }

    console.log(
      'Arduino:',
      message
    );

    try {
      lastArduinoMessage =
        JSON.parse(message);
    } catch {
      lastArduinoMessage = {
        event: 'RAW_MESSAGE',
        message
      };
    }

    if (
      lastArduinoMessage.event ===
        'ALERT_CHANGED' &&
      lastArduinoMessage.level
    ) {
      currentAlertLevel =
        lastArduinoMessage.level;
    }

    notifyMessageListeners(
      lastArduinoMessage
    );
  });

  serialPort.open(error => {
    if (!error) {
      return;
    }

    connectionStatus = 'error';
    arduinoReady = false;

    console.error(
      `Could not open ${arduinoPort}:`,
      error.message
    );
  });
}

export function sendArduinoCommand(
  command
) {
  return new Promise(
    (resolve, reject) => {
      const normalizedCommand =
        String(command || '')
          .trim()
          .toUpperCase();

      if (
        !serialPort ||
        !serialPort.isOpen
      ) {
        reject(
          new Error(
            'Arduino serial port is not connected.'
          )
        );

        return;
      }

      if (
        !arduinoReady &&
        normalizedCommand !== 'PING'
      ) {
        reject(
          new Error(
            'Arduino is starting. Try again shortly.'
          )
        );

        return;
      }

      serialPort.write(
        `${normalizedCommand}\n`,
        error => {
          if (error) {
            reject(error);
            return;
          }

          serialPort.drain(
            drainError => {
              if (drainError) {
                reject(drainError);
                return;
              }

              resolve();
            }
          );
        }
      );
    }
  );
}

export function sendArduinoCommandAndWait(
  command,
  timeoutMilliseconds = 2500
) {
  const normalizedCommand =
    String(command || '')
      .trim()
      .toUpperCase();

  return new Promise(
    (resolve, reject) => {
      let timeoutId = null;
      let settled = false;

      const unsubscribe =
        onArduinoMessage(message => {
          if (
            !messageMatchesCommand(
              normalizedCommand,
              message
            )
          ) {
            return;
          }

          if (settled) {
            return;
          }

          settled = true;

          if (timeoutId) {
            clearTimeout(timeoutId);
          }

          unsubscribe();
          resolve(message);
        });

      timeoutId = setTimeout(() => {
        if (settled) {
          return;
        }

        settled = true;
        unsubscribe();

        reject(
          new Error(
            `Arduino did not acknowledge the ${normalizedCommand} command.`
          )
        );
      }, timeoutMilliseconds);

      sendArduinoCommand(
        normalizedCommand
      ).catch(error => {
        if (settled) {
          return;
        }

        settled = true;
        clearTimeout(timeoutId);
        unsubscribe();
        reject(error);
      });
    }
  );
}

export function getArduinoStatus() {
  return {
    connectionStatus,
    arduinoReady,
    port: arduinoPort,
    baudRate: arduinoBaudRate,
    currentAlertLevel,
    lastArduinoMessage
  };
}

export function setCurrentAlertLevel(
  level
) {
  currentAlertLevel = level;
}

export function onArduinoMessage(
  listener
) {
  messageListeners.add(listener);

  return () => {
    messageListeners.delete(listener);
  };
}

export async function listSerialPorts() {
  return SerialPort.list();
}