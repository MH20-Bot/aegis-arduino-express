import mongoose from 'mongoose';

import {
  FeatureUsage
} from '../models/FeatureUsage.js';

import {
  sendArduinoCommandAndWait
} from '../services/arduinoService.js';

function clampNumber(
  value,
  minimum,
  maximum
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

function normalizeMetrics(
  rawMetrics
) {
  return {
    averageVolume: clampNumber(
      rawMetrics.averageVolume,
      0,
      1
    ),

    peakVolume: clampNumber(
      rawMetrics.peakVolume,
      0,
      1
    ),

    silenceRatio: clampNumber(
      rawMetrics.silenceRatio,
      0,
      1
    ),

    volumeVariation: clampNumber(
      rawMetrics.volumeVariation,
      0,
      1
    ),

    clippingRatio: clampNumber(
      rawMetrics.clippingRatio,
      0,
      1
    ),

    sampleCount: Math.round(
      clampNumber(
        rawMetrics.sampleCount,
        0,
        100000
      )
    )
  };
}

function calculateVoiceResult(metrics) {
  const signalTooWeak =
    metrics.averageVolume < 0.008 ||
    metrics.silenceRatio > 0.82;

  const signalIsClipped =
    metrics.clippingRatio > 0.18;

  if (
    signalTooWeak ||
    signalIsClipped
  ) {
    return {
      level: 'MODERATE',
      irregularityScore: 40,
      signalQuality: 'LIMITED',
      summary:
        'The recording quality was limited. Please repeat the analysis in a quiet room and speak clearly.',
      details:
        'This result reflects microphone signal quality and is not a medical diagnosis.'
    };
  }

  const variationScore = Math.min(
    45,
    (
      metrics.volumeVariation /
      0.12
    ) * 45
  );

  const silenceScore = Math.min(
    35,
    metrics.silenceRatio * 60
  );

  const clippingScore = Math.min(
    20,
    metrics.clippingRatio * 100
  );

  const irregularityScore =
    Math.round(
      Math.min(
        100,
        variationScore +
          silenceScore +
          clippingScore
      )
    );

  if (irregularityScore >= 65) {
    return {
      level: 'HIGH',
      irregularityScore,
      signalQuality: 'UNSTABLE',
      summary:
        'The recorded signal showed strong variation during this prototype voice check.',
      details:
        'The red light and buzzer were activated as a hardware demonstration. This result does not confirm a medical emergency.'
    };
  }

  if (irregularityScore >= 35) {
    return {
      level: 'MODERATE',
      irregularityScore,
      signalQuality: 'LIMITED',
      summary:
        'The recorded signal showed moderate variation during this prototype voice check.',
      details:
        'The yellow warning light was activated. Consider repeating the recording in a quiet environment.'
    };
  }

  return {
    level: 'GOOD',
    irregularityScore,
    signalQuality: 'GOOD',
    summary:
      'The recorded signal remained stable during this prototype voice check.',
    details:
      'The green indicator was activated. This result is not a medical diagnosis.'
  };
}

export async function analyzeVoice(
  request,
  response
) {
  try {
    if (
      mongoose.connection.readyState !== 1
    ) {
      response.status(503).json({
        success: false,
        message:
          'Database connection is not available.'
      });

      return;
    }

    const durationSeconds =
      clampNumber(
        request.body.durationSeconds,
        5,
        60
      );

    const metrics = normalizeMetrics(
      request.body.metrics || {}
    );

    if (metrics.sampleCount < 20) {
      response.status(400).json({
        success: false,
        message:
          'The recording did not contain enough audio samples.'
      });

      return;
    }

    const result =
      calculateVoiceResult(metrics);

    const completedAt =
      new Date();

    const startedAt =
      new Date(
        completedAt.getTime() -
          durationSeconds * 1000
      );

    let hardwareAcknowledged = false;
    let hardwareResponse = null;
    let hardwareError = '';

    try {
      hardwareResponse =
        await sendArduinoCommandAndWait(
          result.level
        );

      hardwareAcknowledged = true;
    } catch (error) {
      hardwareError = error.message;

      console.error(
        'Voice analysis Arduino command failed:',
        error.message
      );
    }

    const usage =
      await FeatureUsage.create({
        user: request.user._id,
        featureSlug:
          'voice-analysis',
        featureName:
          'Voice Analysis',
        status: 'COMPLETED',
        startedAt,
        endedAt: completedAt,
        durationSeconds:
          Math.round(durationSeconds),

        result: {
          summary: result.summary,
          level: result.level,
          details: result.details,

          metrics: {
            ...metrics,

            irregularityScore:
              result.irregularityScore,

            signalQuality:
              result.signalQuality
          },

          hardware: {
            command: result.level,
            acknowledged:
              hardwareAcknowledged,
            response:
              hardwareResponse,
            error:
              hardwareError
          }
        }
      });

    response.status(201).json({
      success: true,

      message:
        hardwareAcknowledged
          ? `Voice analysis completed and Arduino confirmed the ${result.level} alert.`
          : 'Voice analysis was saved, but Arduino did not confirm the alert.',

      analysis: {
        id: usage._id,
        level: result.level,
        summary: result.summary,
        details: result.details,
        irregularityScore:
          result.irregularityScore,
        signalQuality:
          result.signalQuality,
        metrics,
        startedAt,
        completedAt,
        durationSeconds:
          usage.durationSeconds
      },

      hardware: {
        command: result.level,
        acknowledged:
          hardwareAcknowledged,
        response:
          hardwareResponse,
        error:
          hardwareError
      }
    });
  } catch (error) {
    console.error(
      'Voice analysis error:',
      error
    );

    response.status(500).json({
      success: false,
      message:
        'Voice analysis could not be completed.'
    });
  }
}