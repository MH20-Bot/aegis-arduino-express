import mongoose from 'mongoose';

import {
  FeatureUsage
} from '../models/FeatureUsage.js';

import {
  HealthAssistantReport
} from '../models/HealthAssistantReport.js';

import {
  sendArduinoCommandAndWait
} from '../services/arduinoService.js';

const trackedFeatures = [
  {
    slug:
      'voice-analysis',

    name:
      'Voice Analysis',

    weight:
      0.25
  },

  {
    slug:
      'emergency-alerts',

    name:
      'Emergency Alerts',

    weight:
      0.3
  },

  {
    slug:
      'ai-posture-pain-analyzer',

    name:
      'AI Posture and Pain Analyzer',

    weight:
      0.2
  },

  {
    slug:
      'smart-home-sensors',

    name:
      'Smart Home Sensors',

    weight:
      0.2
  },

  {
    slug:
      'ai-digital-twin',

    name:
      'AI Digital Twin',

    weight:
      0.05
  }
];

function databaseIsReady() {
  return mongoose.connection.readyState === 1;
}

function levelToScore(level) {
  const scores = {
    GOOD: 15,
    NORMAL: 15,
    COMPLETED: 20,
    MODERATE: 55,
    HIGH: 90,
    NOT_AVAILABLE: 25
  };

  return (
    scores[
      String(
        level || ''
      ).toUpperCase()
    ] || 25
  );
}

function scoreToLevel(score) {
  if (score >= 65) {
    return 'HIGH';
  }

  if (score >= 35) {
    return 'MODERATE';
  }

  return 'GOOD';
}

function getConfidence(
  sourceCount
) {
  if (sourceCount >= 4) {
    return 'HIGH';
  }

  if (sourceCount >= 2) {
    return 'MEDIUM';
  }

  return 'LOW';
}

function createSummary(
  level,
  overallScore,
  sourceCount
) {
  if (sourceCount === 0) {
    return (
      'There is not enough completed feature data to create a combined health summary.'
    );
  }

  if (level === 'HIGH') {
    return (
      `The combined health warning score is ${overallScore}. ` +
      'One or more recent feature results require attention.'
    );
  }

  if (level === 'MODERATE') {
    return (
      `The combined health warning score is ${overallScore}. ` +
      'Some recent feature results show moderate changes.'
    );
  }

  return (
    `The combined health warning score is ${overallScore}. ` +
    'Recent completed feature results remain within the prototype normal range.'
  );
}

function createActions(
  sources
) {
  const actions = [];

  for (const source of sources) {
    if (
      source.level ===
      'HIGH'
    ) {
      actions.push(
        `Review the latest ${source.featureName} result.`
      );
    }

    if (
      source.level ===
      'MODERATE'
    ) {
      actions.push(
        `Repeat ${source.featureName} when appropriate to confirm the pattern.`
      );
    }
  }

  if (!actions.length) {
    actions.push(
      'Continue routine monitoring and complete missing feature checks.'
    );
  }

  actions.push(
    'This prototype does not provide a medical diagnosis.'
  );

  return actions.slice(
    0,
    6
  );
}

function getNextFeatureSlug(
  availableSlugs
) {
  const priorityOrder = [
    'voice-analysis',
    'smart-home-sensors',
    'ai-posture-pain-analyzer',
    'emergency-alerts',
    'ai-digital-twin'
  ];

  return (
    priorityOrder.find(
      slug =>
        !availableSlugs.has(
          slug
        )
    ) ||
    'voice-analysis'
  );
}

export async function analyzeHealthAssistant(
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

    const featureRecords =
      await FeatureUsage.find({
        user:
          request.user._id,

        status:
          'COMPLETED',

        featureSlug: {
          $in:
            trackedFeatures.map(
              item =>
                item.slug
            )
        }
      })
        .sort({
          endedAt: -1,
          createdAt: -1
        })
        .limit(100)
        .lean();

    const latestByFeature =
      new Map();

    for (
      const record of featureRecords
    ) {
      if (
        !latestByFeature.has(
          record.featureSlug
        )
      ) {
        latestByFeature.set(
          record.featureSlug,
          record
        );
      }
    }

    const sources = [];

    let weightedTotal = 0;
    let usedWeight = 0;

    for (
      const feature of trackedFeatures
    ) {
      const record =
        latestByFeature.get(
          feature.slug
        );

      if (!record) {
        continue;
      }

      const level = String(
        record.result?.level ||
        'NOT_AVAILABLE'
      ).toUpperCase();

      const score =
        levelToScore(
          level
        );

      weightedTotal +=
        score *
        feature.weight;

      usedWeight +=
        feature.weight;

      sources.push({
        featureSlug:
          feature.slug,

        featureName:
          feature.name,

        level,
        score,

        summary:
          record.result?.summary ||
          '',

        recordedAt:
          record.endedAt ||
          record.createdAt
      });
    }

    const sourceCount =
      sources.length;

    const overallScore =
      sourceCount > 0
        ? Math.round(
            weightedTotal /
            usedWeight
          )
        : 0;

    const level =
      scoreToLevel(
        overallScore
      );

    const confidence =
      getConfidence(
        sourceCount
      );

    const summary =
      createSummary(
        level,
        overallScore,
        sourceCount
      );

    const actions =
      createActions(
        sources
      );

    const availableSlugs =
      new Set(
        sources.map(
          source =>
            source.featureSlug
        )
      );

    const nextFeatureSlug =
      getNextFeatureSlug(
        availableSlugs
      );

    let hardwareAcknowledged =
      false;

    let hardwareResponse =
      null;

    let hardwareError =
      '';

    if (sourceCount > 0) {
      try {
        hardwareResponse =
          await sendArduinoCommandAndWait(
            level,
            3000
          );

        hardwareAcknowledged =
          true;
      } catch (error) {
        hardwareError =
          error.message;
      }
    }

    const report =
      await HealthAssistantReport.create({
        user:
          request.user._id,

        sourceCount,
        sources,
        overallScore,
        level,
        confidence,
        summary,
        actions,
        nextFeatureSlug,

        hardware: {
          command:
            sourceCount > 0
              ? level
              : 'NONE',

          acknowledged:
            hardwareAcknowledged,

          response:
            hardwareResponse,

          error:
            hardwareError
        }
      });

    await FeatureUsage.create({
      user:
        request.user._id,

      featureSlug:
        'ai-health-assistant',

      featureName:
        'AI Health Assistant',

      status:
        'COMPLETED',

      startedAt:
        report.createdAt,

      endedAt:
        new Date(),

      durationSeconds:
        1,

      result: {
        level,
        summary,

        details:
          `Combined score: ${overallScore}. ` +
          `Confidence: ${confidence}. ` +
          `Sources: ${sourceCount}.`,

        hardware: {
          command:
            sourceCount > 0
              ? level
              : 'NONE',

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
        sourceCount > 0
          ? 'The latest health feature results were combined successfully.'
          : 'No completed supported health feature records were found.',

      report
    });
  } catch (error) {
    console.error(
      'AI health assistant error:',
      error
    );

    response.status(500).json({
      success: false,
      message:
        'The combined health report could not be created.'
    });
  }
}

export async function getHealthAssistantHistory(
  request,
  response
) {
  try {
    const reports =
      await HealthAssistantReport.find({
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
      reports
    });
  } catch (error) {
    console.error(
      'AI health assistant history error:',
      error
    );

    response.status(500).json({
      success: false,
      message:
        'AI health assistant history could not be loaded.'
    });
  }
}