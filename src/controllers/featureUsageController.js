import mongoose from 'mongoose';

import {
  FeatureUsage
} from '../models/FeatureUsage.js';

const featureNames = {
  'voice-analysis':
    'Voice Analysis',

  'emergency-alerts':
    'Emergency Alerts',

  'ai-digital-twin':
    'AI Digital Twin',

  'blockchain-records':
    'Blockchain Records',

  'smart-home-sensors':
    'Smart Home Sensors',

  'ar-assistant':
    'AR Assistant',

  'posture-pain-analyzer':
    'AI Posture & Pain Analyzer'
};

function databaseIsConnected() {
  return mongoose.connection.readyState === 1;
}

export async function startFeatureUsage(
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

    const featureSlug = String(
      request.body.featureSlug || ''
    ).trim();

    const featureName =
      featureNames[featureSlug];

    if (!featureName) {
      response.status(400).json({
        success: false,
        message:
          'The selected feature is invalid.'
      });

      return;
    }

    const usage =
      await FeatureUsage.create({
        user: request.user._id,
        featureSlug,
        featureName,
        status: 'STARTED',
        startedAt: new Date()
      });

    response.status(201).json({
      success: true,
      message:
        'Feature session started.',
      usage
    });
  } catch (error) {
    console.error(
      'Feature start error:',
      error.message
    );

    response.status(500).json({
      success: false,
      message:
        'Feature session could not be started.'
    });
  }
}

export async function completeFeatureUsage(
  request,
  response
) {
  try {
    const usage = await FeatureUsage.findOne({
      _id: request.params.usageId,
      user: request.user._id
    });

    if (!usage) {
      response.status(404).json({
        success: false,
        message:
          'Feature session was not found.'
      });

      return;
    }

    if (usage.status !== 'STARTED') {
      response.status(400).json({
        success: false,
        message:
          'This feature session has already ended.'
      });

      return;
    }

    const endedAt = new Date();

    const durationMilliseconds =
      endedAt.getTime() -
      usage.startedAt.getTime();

    const durationSeconds = Math.max(
      1,
      Math.round(
        durationMilliseconds / 1000
      )
    );

    usage.status = 'COMPLETED';
    usage.endedAt = endedAt;
    usage.durationSeconds =
      durationSeconds;

    usage.result = {
      summary: String(
        request.body.summary ||
          'Feature session completed successfully.'
      ).trim(),

      level: String(
        request.body.level ||
          'COMPLETED'
      ).toUpperCase(),

      details: String(
        request.body.details || ''
      ).trim()
    };

    await usage.save();

    response.json({
      success: true,
      message:
        'Feature session completed.',
      usage
    });
  } catch (error) {
    console.error(
      'Feature completion error:',
      error.message
    );

    response.status(500).json({
      success: false,
      message:
        'Feature session could not be completed.'
    });
  }
}

export async function getFeatureHistory(
  request,
  response
) {
  try {
    const usageHistory =
      await FeatureUsage.find({
        user: request.user._id
      })
        .sort({
          startedAt: -1
        })
        .limit(100)
        .lean();

    response.json({
      success: true,
      usageHistory
    });
  } catch (error) {
    response.status(500).json({
      success: false,
      message:
        'Feature history could not be loaded.'
    });
  }
}