import mongoose from 'mongoose';

import {
  ARAssistantSession
} from '../models/ARAssistantSession.js';

import {
  FeatureUsage
} from '../models/FeatureUsage.js';

const allowedModes = [
  'EMERGENCY_GUIDANCE',
  'POSTURE_GUIDANCE',
  'ROOM_SAFETY'
];

function databaseIsReady() {
  return mongoose.connection.readyState === 1;
}

function normalizeMode(value) {
  const mode = String(
    value || ''
  ).toUpperCase();

  return allowedModes.includes(
    mode
  )
    ? mode
    : null;
}

export async function startARSession(
  request,
  response
) {
  try {
    if (!databaseIsReady()) {
      response.status(503).json({
        success: false,
        message:
          'Database connection is not available.'
      });

      return;
    }

    const mode =
      normalizeMode(
        request.body.mode
      );

    if (!mode) {
      response.status(400).json({
        success: false,
        message:
          'The selected AR guidance mode is invalid.'
      });

      return;
    }

    const session =
      await ARAssistantSession.create({
        user:
          request.user._id,

        mode,
        status:
          'STARTED',

        startedAt:
          new Date()
      });

    response.status(201).json({
      success: true,
      message:
        'The AR guidance session started.',
      session
    });
  } catch (error) {
    console.error(
      'AR session start error:',
      error
    );

    response.status(500).json({
      success: false,
      message:
        'The AR guidance session could not be started.'
    });
  }
}

export async function completeARSession(
  request,
  response
) {
  try {
    const session =
      await ARAssistantSession.findOne({
        _id:
          request.params.sessionId,

        user:
          request.user._id
      });

    if (!session) {
      response.status(404).json({
        success: false,
        message:
          'The AR guidance session was not found.'
      });

      return;
    }

    const completedAt =
      new Date();

    const durationSeconds =
      Math.max(
        1,
        Math.round(
          (
            completedAt.getTime() -
            session.startedAt.getTime()
          ) / 1000
        )
      );

    const completedSteps =
      Array.isArray(
        request.body.completedSteps
      )
        ? request.body.completedSteps
            .map(value =>
              String(value)
                .trim()
            )
            .filter(Boolean)
            .slice(0, 20)
        : [];

    const featureUsage =
      await FeatureUsage.create({
        user:
          request.user._id,

        featureSlug:
          'ar-assistant',

        featureName:
          'AR Assistant',

        status:
          'COMPLETED',

        startedAt:
          session.startedAt,

        endedAt:
          completedAt,

        durationSeconds,

        result: {
          level:
            'COMPLETED',

          summary:
            `${session.mode} AR guidance was completed.`,

          details:
            `${completedSteps.length} guidance steps were completed.`,

          hardware: {
            command:
              'NONE',

            acknowledged:
              false,

            response:
              null,

            error:
              ''
          }
        }
      });

    session.featureUsage =
      featureUsage._id;

    session.status =
      'COMPLETED';

    session.completedSteps =
      completedSteps;

    session.completedAt =
      completedAt;

    session.durationSeconds =
      durationSeconds;

    session.resultLevel =
      'COMPLETED';

    await session.save();

    response.json({
      success: true,
      message:
        'The AR guidance session was completed and saved.',
      session
    });
  } catch (error) {
    console.error(
      'AR session completion error:',
      error
    );

    response.status(500).json({
      success: false,
      message:
        'The AR guidance session could not be completed.'
    });
  }
}

export async function getARHistory(
  request,
  response
) {
  try {
    const sessions =
      await ARAssistantSession.find({
        user:
          request.user._id
      })
        .sort({
          createdAt: -1
        })
        .limit(30)
        .lean();

    response.json({
      success: true,
      sessions
    });
  } catch (error) {
    console.error(
      'AR history error:',
      error
    );

    response.status(500).json({
      success: false,
      message:
        'AR guidance history could not be loaded.'
    });
  }
}