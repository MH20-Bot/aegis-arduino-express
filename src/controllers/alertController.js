import mongoose from 'mongoose';

import { AlertEvent } from '../models/AlertEvent.js';

import {
  getArduinoStatus,
  sendArduinoCommand,
  setCurrentAlertLevel
} from '../services/arduinoService.js';

const validAlertLevels = new Set([
  'GOOD',
  'MODERATE',
  'HIGH',
  'OFF'
]);

async function saveAlertEvent(data) {
  if (mongoose.connection.readyState !== 1) {
    return null;
  }

  try {
    return await AlertEvent.create(data);
  } catch (error) {
    console.error(
      'Could not save alert event:',
      error.message
    );

    return null;
  }
}

export async function sendAlert(
  request,
  response
) {
  try {
    const level = String(
      request.body.level || ''
    )
      .trim()
      .toUpperCase();

    if (!validAlertLevels.has(level)) {
      response.status(400).json({
        success: false,
        message:
          'Level must be GOOD, MODERATE, HIGH, or OFF.'
      });

      return;
    }

    await sendArduinoCommand(level);

    setCurrentAlertLevel(level);

    const status = getArduinoStatus();

    const savedEvent = await saveAlertEvent({
      level,
      source: 'frontend',
      commandSent: true,
      arduinoConnected:
        status.connectionStatus === 'connected',
      message: `${level} command sent to Arduino.`
    });

    response.json({
      success: true,
      message: `${level} command sent to Arduino.`,
      level,
      savedToDatabase: Boolean(savedEvent)
    });
  } catch (error) {
    response.status(503).json({
      success: false,
      message: error.message
    });
  }
}

export function readArduinoStatus(
  request,
  response
) {
  response.json({
    success: true,
    ...getArduinoStatus()
  });
}

export async function getAlertHistory(
  request,
  response
) {
  try {
    if (mongoose.connection.readyState !== 1) {
      response.json({
        success: true,
        databaseConnected: false,
        alerts: []
      });

      return;
    }

    const alerts = await AlertEvent.find()
      .sort({
        createdAt: -1
      })
      .limit(50)
      .lean();

    response.json({
      success: true,
      databaseConnected: true,
      alerts
    });
  } catch (error) {
    response.status(500).json({
      success: false,
      message:
        'Could not load alert history.'
    });
  }
}