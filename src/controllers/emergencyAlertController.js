import mongoose from 'mongoose';

import {
  EmergencyAlertEvent
} from '../models/EmergencyAlertEvent.js';

import {
  FeatureUsage
} from '../models/FeatureUsage.js';

import {
  getArduinoStatus,
  sendArduinoCommandAndWait
} from '../services/arduinoService.js';

const allowedLevels = new Set([
  'GOOD',
  'MODERATE',
  'HIGH',
  'OFF'
]);

const levelPriority = {
  OFF: 0,
  GOOD: 1,
  MODERATE: 2,
  HIGH: 3
};

function databaseIsConnected() {
  return mongoose.connection.readyState === 1;
}

function getHighestAlertLevel(events) {
  let highestLevel = 'COMPLETED';
  let highestPriority = 0;

  for (const event of events) {
    if (!event.hardwareAcknowledged) {
      continue;
    }

    const priority =
      levelPriority[event.level] || 0;

    if (priority > highestPriority) {
      highestPriority = priority;
      highestLevel = event.level;
    }
  }

  return highestLevel;
}

export async function startEmergencySession(
  request,
  response
) {
  try {
    if (!databaseIsConnected()) {
      response.status(503).json({
        success: false,
        message:
          'Database connection is not available.'
      });

      return;
    }

    const existingSession =
      await FeatureUsage.findOne({
        user: request.user._id,
        featureSlug: 'emergency-alerts',
        status: 'STARTED'
      }).sort({
        startedAt: -1
      });

    if (existingSession) {
      response.json({
        success: true,
        resumed: true,
        message:
          'Your existing emergency alert session was resumed.',
        session: existingSession
      });

      return;
    }

    const session =
      await FeatureUsage.create({
        user: request.user._id,
        featureSlug: 'emergency-alerts',
        featureName: 'Emergency Alerts',
        status: 'STARTED',
        startedAt: new Date()
      });

    response.status(201).json({
      success: true,
      resumed: false,
      message:
        'Emergency alert session started.',
      session
    });
  } catch (error) {
    console.error(
      'Emergency session start error:',
      error
    );

    response.status(500).json({
      success: false,
      message:
        'Emergency alert session could not be started.'
    });
  }
}

export async function triggerEmergencyAlert(
  request,
  response
) {
  try {
    if (!databaseIsConnected()) {
      response.status(503).json({
        success: false,
        message:
          'Database connection is not available.'
      });

      return;
    }

    const level = String(
      request.body.level || ''
    )
      .trim()
      .toUpperCase();

    const note = String(
      request.body.note || ''
    ).trim();

    if (!allowedLevels.has(level)) {
      response.status(400).json({
        success: false,
        message:
          'Alert level must be GOOD, MODERATE, HIGH, or OFF.'
      });

      return;
    }

    const session =
      await FeatureUsage.findOne({
        _id: request.params.usageId,
        user: request.user._id,
        featureSlug: 'emergency-alerts',
        status: 'STARTED'
      });

    if (!session) {
      response.status(404).json({
        success: false,
        message:
          'An active emergency alert session was not found.'
      });

      return;
    }

    let hardwareAcknowledged = false;
    let hardwareResponse = null;
    let hardwareError = '';

    try {
      hardwareResponse =
        await sendArduinoCommandAndWait(
          level,
          3000
        );

      hardwareAcknowledged = true;
    } catch (error) {
      hardwareError = error.message;

      console.error(
        `Arduino ${level} command failed:`,
        error.message
      );
    }

    const alertEvent =
      await EmergencyAlertEvent.create({
        user: request.user._id,
        featureUsage: session._id,
        level,
        note,
        hardwareAcknowledged,
        hardwareResponse,
        hardwareError
      });

    if (!hardwareAcknowledged) {
      response.status(503).json({
        success: false,
        message:
          `The ${level} command was recorded, but Arduino did not confirm it.`,
        event: alertEvent,
        hardware: {
          acknowledged: false,
          error: hardwareError
        }
      });

      return;
    }

    response.json({
      success: true,
      message:
        `Arduino confirmed the ${level} emergency alert.`,
      event: alertEvent,
      hardware: {
        acknowledged: true,
        response: hardwareResponse
      }
    });
  } catch (error) {
    console.error(
      'Emergency alert trigger error:',
      error
    );

    response.status(500).json({
      success: false,
      message:
        'The emergency alert could not be activated.'
    });
  }
}

export async function finishEmergencySession(
  request,
  response
) {
  try {
    if (!databaseIsConnected()) {
      response.status(503).json({
        success: false,
        message:
          'Database connection is not available.'
      });

      return;
    }

    const session =
      await FeatureUsage.findOne({
        _id: request.params.usageId,
        user: request.user._id,
        featureSlug: 'emergency-alerts',
        status: 'STARTED'
      });

    if (!session) {
      response.status(404).json({
        success: false,
        message:
          'An active emergency alert session was not found.'
      });

      return;
    }

    let hardwareAcknowledged = false;
    let hardwareResponse = null;
    let hardwareError = '';

    try {
      hardwareResponse =
        await sendArduinoCommandAndWait(
          'OFF',
          3000
        );

      hardwareAcknowledged = true;
    } catch (error) {
      hardwareError = error.message;

      console.error(
        'Arduino OFF command failed:',
        error.message
      );
    }

    await EmergencyAlertEvent.create({
      user: request.user._id,
      featureUsage: session._id,
      level: 'OFF',
      note:
        'Emergency alert session ended.',
      hardwareAcknowledged,
      hardwareResponse,
      hardwareError
    });

    const events =
      await EmergencyAlertEvent.find({
        user: request.user._id,
        featureUsage: session._id
      }).sort({
        createdAt: 1
      });

    const endedAt = new Date();

    const durationSeconds = Math.max(
      1,
      Math.round(
        (
          endedAt.getTime() -
          session.startedAt.getTime()
        ) / 1000
      )
    );

    const highestLevel =
      getHighestAlertLevel(events);

    const alertCount =
      events.filter(
        event => event.level !== 'OFF'
      ).length;

    session.status = 'COMPLETED';
    session.endedAt = endedAt;
    session.durationSeconds =
      durationSeconds;

    session.result = {
      level: highestLevel,

      summary:
        `Emergency alert session completed with ${alertCount} alert command${alertCount === 1 ? '' : 's'}.`,

      details:
        highestLevel === 'COMPLETED'
          ? 'No acknowledged warning level was activated during this session.'
          : `The highest acknowledged emergency level was ${highestLevel}.`,

      hardware: {
        command: 'OFF',
        acknowledged:
          hardwareAcknowledged,
        response:
          hardwareResponse,
        error:
          hardwareError
      }
    };

    await session.save();

    response.json({
      success: true,

      message:
        hardwareAcknowledged
          ? 'Emergency session completed and Arduino hardware was turned off.'
          : 'Emergency session was saved, but Arduino did not confirm the OFF command.',

      session,

      summary: {
        alertCount,
        highestLevel,
        durationSeconds,
        hardwareTurnedOff:
          hardwareAcknowledged
      }
    });
  } catch (error) {
    console.error(
      'Emergency session completion error:',
      error
    );

    response.status(500).json({
      success: false,
      message:
        'Emergency alert session could not be completed.'
    });
  }
}

export async function getEmergencyEvents(
  request,
  response
) {
  try {
    const session =
      await FeatureUsage.findOne({
        _id: request.params.usageId,
        user: request.user._id,
        featureSlug: 'emergency-alerts'
      });

    if (!session) {
      response.status(404).json({
        success: false,
        message:
          'Emergency alert session was not found.'
      });

      return;
    }

    const events =
      await EmergencyAlertEvent.find({
        user: request.user._id,
        featureUsage: session._id
      })
        .sort({
          createdAt: -1
        })
        .lean();

    response.json({
      success: true,
      session,
      events
    });
  } catch (error) {
    console.error(
      'Emergency event history error:',
      error
    );

    response.status(500).json({
      success: false,
      message:
        'Emergency alert history could not be loaded.'
    });
  }
}

export function readEmergencyHardwareStatus(
  request,
  response
) {
  response.json({
    success: true,
    ...getArduinoStatus()
  });
}