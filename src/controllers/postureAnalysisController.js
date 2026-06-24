import mongoose from 'mongoose';

import {
  FeatureUsage
} from '../models/FeatureUsage.js';

import {
  PostureAnalysis
} from '../models/PostureAnalysis.js';

import {
  sendArduinoCommandAndWait
} from '../services/arduinoService.js';

function databaseIsReady() {
  return mongoose.connection.readyState === 1;
}

function clamp(
  value,
  minimum = 0,
  maximum = 100
) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return minimum;
  }

  return Math.min(
    maximum,
    Math.max(
      minimum,
      numericValue
    )
  );
}

function normalizeAngles(value = {}) {
  return {
    shoulderTilt: clamp(
      value.shoulderTilt,
      0,
      90
    ),

    headTilt: clamp(
      value.headTilt,
      0,
      90
    ),

    torsoLean: clamp(
      value.torsoLean,
      0,
      90
    ),

    hipTilt: clamp(
      value.hipTilt,
      0,
      90
    )
  };
}

function calculateDifferences(
  baseline,
  average
) {
  return {
    shoulderTilt: Math.abs(
      average.shoulderTilt -
        baseline.shoulderTilt
    ),

    headTilt: Math.abs(
      average.headTilt -
        baseline.headTilt
    ),

    torsoLean: Math.abs(
      average.torsoLean -
        baseline.torsoLean
    ),

    hipTilt: Math.abs(
      average.hipTilt -
        baseline.hipTilt
    )
  };
}

function calculatePostureScore(
  differences,
  stabilityScore
) {
  const instability =
    100 - stabilityScore;

  const calculatedScore =
    differences.shoulderTilt * 2.8 +
    differences.headTilt * 2.2 +
    differences.torsoLean * 2.7 +
    differences.hipTilt * 1.8 +
    instability * 0.22;

  return Math.round(
    clamp(
      calculatedScore
    )
  );
}

function scoreToLevel(score) {
  if (score >= 55) {
    return 'HIGH';
  }

  if (score >= 25) {
    return 'MODERATE';
  }

  return 'GOOD';
}

function createGuidance(
  differences,
  stabilityScore
) {
  const guidance = [];

  if (
    differences.shoulderTilt >= 6
  ) {
    guidance.push(
      'Level both shoulders and avoid leaning toward one side.'
    );
  }

  if (
    differences.headTilt >= 7
  ) {
    guidance.push(
      'Keep the head centred above the shoulders.'
    );
  }

  if (
    differences.torsoLean >= 7
  ) {
    guidance.push(
      'Bring the upper body back toward the calibrated centre position.'
    );
  }

  if (
    differences.hipTilt >= 6
  ) {
    guidance.push(
      'Balance body weight evenly and keep the hips level.'
    );
  }

  if (stabilityScore < 65) {
    guidance.push(
      'Reduce repeated movement and hold a stable posture briefly.'
    );
  }

  if (!guidance.length) {
    guidance.push(
      'Current posture remains close to the personal calibrated baseline.'
    );
  }

  return guidance;
}

function createSummary(
  level,
  postureScore
) {
  if (level === 'HIGH') {
    return (
      'A strong posture change was detected. ' +
      `The personal posture score is ${postureScore}.`
    );
  }

  if (level === 'MODERATE') {
    return (
      'A moderate posture change was detected. ' +
      `The personal posture score is ${postureScore}.`
    );
  }

  return (
    'Posture remains close to the personal baseline. ' +
    `The personal posture score is ${postureScore}.`
  );
}

export async function analyzePosture(
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

    const durationSeconds = Math.round(
      clamp(
        request.body.durationSeconds,
        5,
        120
      )
    );

    const frameCount = Math.round(
      clamp(
        request.body.frameCount,
        1,
        10000
      )
    );

    const poseConfidence = clamp(
      request.body.poseConfidence,
      0,
      1
    );

    if (frameCount < 30) {
      response.status(400).json({
        success: false,
        message:
          'Not enough posture frames were detected. Keep the upper body visible and scan again.'
      });

      return;
    }

    if (poseConfidence < 0.5) {
      response.status(400).json({
        success: false,
        message:
          'Pose visibility was too low. Move back and keep the head, shoulders, and hips visible.'
      });

      return;
    }

    const baseline = normalizeAngles(
      request.body.baseline
    );

    const average = normalizeAngles(
      request.body.measurements?.average
    );

    const maximum = normalizeAngles(
      request.body.measurements?.maximum
    );

    const stabilityScore = clamp(
      request.body.measurements?.stabilityScore,
      0,
      100
    );

    const differences =
      calculateDifferences(
        baseline,
        average
      );

    const postureScore =
      calculatePostureScore(
        differences,
        stabilityScore
      );

    const level =
      scoreToLevel(
        postureScore
      );

    const guidance =
      createGuidance(
        differences,
        stabilityScore
      );

    const summary =
      createSummary(
        level,
        postureScore
      );

    let sentCommand = level;

    if (
      level === 'HIGH' &&
      poseConfidence < 0.7
    ) {
      sentCommand = 'MODERATE';

      guidance.push(
        'The hardware warning was reduced because pose visibility confidence was limited.'
      );
    }

    let hardwareAcknowledged = false;
    let hardwareResponse = null;
    let hardwareError = '';

    try {
      hardwareResponse =
        await sendArduinoCommandAndWait(
          sentCommand,
          3000
        );

      hardwareAcknowledged = true;
    } catch (error) {
      hardwareError =
        error.message;
    }

    const completedAt = new Date();

    const startedAt = new Date(
      completedAt.getTime() -
        durationSeconds * 1000
    );

    const featureUsage =
      await FeatureUsage.create({
        user: request.user._id,

        featureSlug:
          'ai-posture-pain-analyzer',

        featureName:
          'AI Posture & Pain Analyzer',

        status: 'COMPLETED',

        startedAt,
        endedAt: completedAt,
        durationSeconds,

        result: {
          level,
          summary,

          details:
            `Posture score: ${postureScore}. ` +
            `Pose confidence: ${Math.round(
              poseConfidence * 100
            )} percent. ` +
            `Stability score: ${Math.round(
              stabilityScore
            )}.`,

          hardware: {
            command: sentCommand,
            acknowledged:
              hardwareAcknowledged,
            response:
              hardwareResponse,
            error:
              hardwareError
          }
        }
      });

    const analysis =
      await PostureAnalysis.create({
        user: request.user._id,

        featureUsage:
          featureUsage._id,

        startedAt,
        completedAt,
        durationSeconds,
        frameCount,
        poseConfidence,
        baseline,

        measurements: {
          average,
          maximum,
          stabilityScore
        },

        differences,
        postureScore,
        level,
        summary,
        guidance,

        hardware: {
          requestedCommand:
            level,

          sentCommand,

          acknowledged:
            hardwareAcknowledged,

          response:
            hardwareResponse,

          error:
            hardwareError
        }
      });

    response.status(201).json({
      success: true,

      message:
        hardwareAcknowledged
          ? `Posture analysis completed and Arduino confirmed ${sentCommand}.`
          : 'Posture analysis was saved, but Arduino did not confirm the command.',

      analysis
    });
  } catch (error) {
    console.error(
      'Posture analysis error:',
      error
    );

    response.status(500).json({
      success: false,
      message:
        'Posture analysis could not be completed.'
    });
  }
}

export async function getPostureHistory(
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

    const analyses =
      await PostureAnalysis.find({
        user: request.user._id
      })
        .sort({
          createdAt: -1
        })
        .limit(30)
        .lean();

    response.json({
      success: true,
      analyses
    });
  } catch (error) {
    console.error(
      'Posture history error:',
      error
    );

    response.status(500).json({
      success: false,
      message:
        'Posture analysis history could not be loaded.'
    });
  }
}

