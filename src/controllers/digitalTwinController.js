import mongoose from 'mongoose';

import {
  DigitalTwinProfile
} from '../models/DigitalTwinProfile.js';

import {
  DigitalTwinSnapshot
} from '../models/DigitalTwinSnapshot.js';

import {
  EmergencyIncident
} from '../models/EmergencyIncident.js';

import {
  FeatureUsage
} from '../models/FeatureUsage.js';

import {
  getArduinoStatus,
  sendArduinoCommandAndWait
} from '../services/arduinoService.js';

const scenarioDefinitions = {
  REST_RECOVERY: {
    title: 'Rest Recovery',
    description:
      'Simulates a lower activity and stress period.',
    scoreModifier: -12
  },

  CLEANER_AIR: {
    title: 'Cleaner Air',
    description:
      'Simulates reduced environmental respiratory pressure.',
    scoreModifier: -10
  },

  HYDRATION_ROUTINE: {
    title: 'Hydration Routine',
    description:
      'Simulates a consistent hydration routine.',
    scoreModifier: -8
  },

  LIGHT_ACTIVITY: {
    title: 'Light Activity',
    description:
      'Simulates gentle movement and reduced inactivity.',
    scoreModifier: -5
  },

  HIGH_STRESS: {
    title: 'High Stress',
    description:
      'Simulates increased stress and reduced recovery.',
    scoreModifier: 15
  },

  POOR_SLEEP: {
    title: 'Poor Sleep',
    description:
      'Simulates reduced sleep quality and recovery.',
    scoreModifier: 14
  },

  POLLUTION_EXPOSURE: {
    title: 'Pollution Exposure',
    description:
      'Simulates increased environmental exposure.',
    scoreModifier: 18
  }
};

function databaseIsReady() {
  return (
    mongoose.connection.readyState === 1
  );
}

function requireDatabase(response) {
  if (databaseIsReady()) {
    return true;
  }

  response.status(503).json({
    success: false,
    message:
      'Database connection is not available.'
  });

  return false;
}

function clamp(
  value,
  minimum = 0,
  maximum = 100
) {
  const numericValue =
    Number(value);

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

function average(values) {
  if (!values.length) {
    return 0;
  }

  return (
    values.reduce(
      (total, value) =>
        total + value,
      0
    ) / values.length
  );
}

function median(values) {
  if (!values.length) {
    return 0;
  }

  const sortedValues = [
    ...values
  ].sort(
    (first, second) =>
      first - second
  );

  const middleIndex =
    Math.floor(
      sortedValues.length / 2
    );

  if (
    sortedValues.length % 2 ===
    0
  ) {
    return (
      sortedValues[
        middleIndex - 1
      ] +
      sortedValues[
        middleIndex
      ]
    ) / 2;
  }

  return sortedValues[
    middleIndex
  ];
}

function levelToPressure(level) {
  const levels = {
    GOOD: 15,
    NORMAL: 15,
    COMPLETED: 20,
    MODERATE: 55,
    HIGH: 90,
    NOT_AVAILABLE: 25
  };

  return (
    levels[
      String(
        level ||
        ''
      ).toUpperCase()
    ] || 20
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
  totalRecords
) {
  if (totalRecords >= 20) {
    return 'HIGH';
  }

  if (totalRecords >= 8) {
    return 'MEDIUM';
  }

  return 'LOW';
}

function getDirection(
  previousScore,
  currentScore
) {
  const difference =
    currentScore -
    previousScore;

  if (difference >= 6) {
    return 'RISING';
  }

  if (difference <= -6) {
    return 'IMPROVING';
  }

  return 'STABLE';
}

function getRefreshWindow(level) {
  if (level === 'HIGH') {
    return '30_MINUTES';
  }

  if (level === 'MODERATE') {
    return '6_HOURS';
  }

  return '24_HOURS';
}

function getNextDataAction(
  coverage
) {
  if (
    coverage.voiceSamples <
    3
  ) {
    return {
      featureSlug:
        'voice-analysis',

      title:
        'Complete Voice Analysis',

      reason:
        'More voice samples are required to create a stronger personal baseline.',

      priority: 'HIGH'
    };
  }

  if (
    coverage
      .environmentalSamples ===
    0
  ) {
    return {
      featureSlug:
        'smart-home-sensors',

      title:
        'Connect Environmental Sensors',

      reason:
        'Air quality, temperature, and humidity data are missing from the twin.',

      priority: 'MEDIUM'
    };
  }

  if (
    coverage.wearableSamples ===
    0
  ) {
    return {
      featureSlug:
        'wearable-integration',

      title:
        'Connect a Wearable Device',

      reason:
        'Heart rate, oxygen, sleep, and activity data could improve twin confidence.',

      priority: 'MEDIUM'
    };
  }

  return {
    featureSlug:
      'ai-digital-twin',

    title:
      'Create Another Snapshot',

    reason:
      'The twin has enough data for routine pattern monitoring.',

    priority: 'LOW'
  };
}

function createDrivers({
  voiceDifference,
  emergencyPressure,
  recentEmergencyCount,
  trendPressure,
  confidence
}) {
  const drivers = [];

  if (voiceDifference >= 20) {
    drivers.push(
      'Voice pattern is significantly above the personal baseline.'
    );
  } else if (
    voiceDifference >= 8
  ) {
    drivers.push(
      'Voice pattern is moderately above the personal baseline.'
    );
  }

  if (emergencyPressure >= 60) {
    drivers.push(
      'Recent emergency activity increased the current twin score.'
    );
  }

  if (
    recentEmergencyCount >= 2
  ) {
    drivers.push(
      'Multiple emergency incidents were recorded recently.'
    );
  }

  if (trendPressure >= 15) {
    drivers.push(
      'Recent twin snapshots show a rising pattern.'
    );
  }

  if (confidence === 'LOW') {
    drivers.push(
      'Limited historical data reduces result confidence.'
    );
  }

  if (!drivers.length) {
    drivers.push(
      'Current information remains close to the personal baseline.'
    );
  }

  return drivers;
}

async function collectUserData(
  userId
) {
  const featureRecords =
    await FeatureUsage.find({
      user: userId,
      status: 'COMPLETED'
    })
      .sort({
        createdAt: -1
      })
      .limit(100)
      .lean();

  const emergencyIncidents =
    await EmergencyIncident.find({
      user: userId
    })
      .sort({
        startedAt: -1
      })
      .limit(50)
      .lean();

  const voiceRecords =
    featureRecords.filter(
      record =>
        record.featureSlug ===
        'voice-analysis'
    );

  const voiceScores =
    voiceRecords
      .map(record => {
        const metricScore =
          record.result
            ?.metrics
            ?.irregularityScore;

        if (
          Number.isFinite(
            Number(metricScore)
          )
        ) {
          return clamp(
            metricScore
          );
        }

        return levelToPressure(
          record.result?.level
        );
      });

  const completedDurations =
    featureRecords
      .map(record =>
        Number(
          record.durationSeconds
        )
      )
      .filter(value =>
        Number.isFinite(value)
      );

  return {
    featureRecords,
    emergencyIncidents,
    voiceRecords,
    voiceScores,
    completedDurations
  };
}

export async function getDigitalTwinProfile(
  request,
  response
) {
  try {
    if (
      !requireDatabase(
        response
      )
    ) {
      return;
    }

    const profile =
      await DigitalTwinProfile
        .findOne({
          user:
            request.user._id
        })
        .lean();

    const latestSnapshot =
      await DigitalTwinSnapshot
        .findOne({
          user:
            request.user._id
        })
        .sort({
          createdAt: -1
        })
        .lean();

    response.json({
      success: true,
      profile,
      latestSnapshot,
      hardware:
        getArduinoStatus(),
      scenarios:
        scenarioDefinitions
    });
  } catch (error) {
    console.error(
      'Digital twin profile error:',
      error
    );

    response.status(500).json({
      success: false,
      message:
        'Digital twin profile could not be loaded.'
    });
  }
}

export async function buildDigitalTwinProfile(
  request,
  response
) {
  try {
    if (
      !requireDatabase(
        response
      )
    ) {
      return;
    }

    const data =
      await collectUserData(
        request.user._id
      );

    const emergencyScores =
      data.emergencyIncidents.map(
        incident =>
          levelToPressure(
            incident.level
          )
      );

    const baselineVoice =
      data.voiceScores.length
        ? median(
            data.voiceScores
          )
        : 20;

    const baselineEmergency =
      emergencyScores.length
        ? average(
            emergencyScores
          )
        : 0;

    const baselineDuration =
      data.completedDurations
        .length
        ? average(
            data
              .completedDurations
          )
        : 0;

    const stabilityScore =
      clamp(
        100 -
          (
            baselineVoice *
              0.55 +
            baselineEmergency *
              0.45
          )
      );

    const totalRecords =
      data.featureRecords
        .length +
      data.emergencyIncidents
        .length;

    const confidence =
      getConfidence(
        totalRecords
      );

    const profile =
      await DigitalTwinProfile
        .findOneAndUpdate(
          {
            user:
              request.user._id
          },
          {
            user:
              request.user._id,

            status:
              totalRecords >= 3
                ? 'ACTIVE'
                : 'LIMITED_DATA',

            baseline: {
              voiceIrregularity:
                Math.round(
                  baselineVoice
                ),

              emergencyPressure:
                Math.round(
                  baselineEmergency
                ),

              averageSessionDuration:
                Math.round(
                  baselineDuration
                ),

              stabilityScore:
                Math.round(
                  stabilityScore
                )
            },

            dataCoverage: {
              totalRecords,

              voiceSamples:
                data.voiceRecords
                  .length,

              emergencyIncidents:
                data
                  .emergencyIncidents
                  .length,

              wearableSamples:
                0,

              environmentalSamples:
                0,

              confidence
            },

            lastBuiltAt:
              new Date(),

            disclaimerAccepted:
              request.body
                .disclaimerAccepted ===
              true
          },
          {
            new: true,
            upsert: true,
            setDefaultsOnInsert:
              true
          }
        );

    response.json({
      success: true,

      message:
        totalRecords >= 3
          ? 'Personal digital twin baseline created successfully.'
          : 'Digital twin created with limited data. Complete more features to improve confidence.',

      profile
    });
  } catch (error) {
    console.error(
      'Digital twin build error:',
      error
    );

    response.status(500).json({
      success: false,
      message:
        'Digital twin baseline could not be created.'
    });
  }
}

export async function createDigitalTwinSnapshot(
  request,
  response
) {
  try {
    if (
      !requireDatabase(
        response
      )
    ) {
      return;
    }

    const profile =
      await DigitalTwinProfile
        .findOne({
          user:
            request.user._id
        });

    if (!profile) {
      response.status(400).json({
        success: false,
        message:
          'Build the digital twin baseline before creating a snapshot.'
      });

      return;
    }

    const data =
      await collectUserData(
        request.user._id
      );

    const latestVoiceScore =
      data.voiceScores.length
        ? data.voiceScores[0]
        : profile.baseline
            .voiceIrregularity;

    const sevenDaysAgo =
      new Date(
        Date.now() -
          7 *
            24 *
            60 *
            60 *
            1000
      );

    const recentIncidents =
      data.emergencyIncidents
        .filter(incident =>
          new Date(
            incident.startedAt
          ) >= sevenDaysAgo
        );

    const highestEmergencyScore =
      recentIncidents.length
        ? Math.max(
            ...recentIncidents.map(
              incident =>
                levelToPressure(
                  incident.level
                )
            )
          )
        : 0;

    const emergencyPressure =
      clamp(
        highestEmergencyScore +
          Math.min(
            25,
            recentIncidents.length *
              8
          )
      );

    const currentDuration =
      data.completedDurations
        .length
        ? average(
            data
              .completedDurations
              .slice(0, 5)
          )
        : 0;

    const previousSnapshots =
      await DigitalTwinSnapshot
        .find({
          user:
            request.user._id
        })
        .sort({
          createdAt: -1
        })
        .limit(5)
        .lean();

    const previousScore =
      previousSnapshots[0]
        ?.driftScore ||
      0;

    const trendPressure =
      previousSnapshots.length >=
      2
        ? clamp(
            previousSnapshots[0]
              .driftScore -
              previousSnapshots[
                previousSnapshots
                  .length - 1
              ].driftScore,
            0,
            100
          )
        : 0;

    const voiceDifference =
      latestVoiceScore -
      profile.baseline
        .voiceIrregularity;

    const emergencyDifference =
      emergencyPressure -
      profile.baseline
        .emergencyPressure;

    const durationDifference =
      currentDuration -
      profile.baseline
        .averageSessionDuration;

    const positiveVoiceDifference =
      Math.max(
        0,
        voiceDifference
      );

    const positiveEmergencyDifference =
      Math.max(
        0,
        emergencyDifference
      );

    const normalizedDurationLoad =
      clamp(
        currentDuration /
          3
      );

    const driftScore =
      Math.round(
        clamp(
          latestVoiceScore *
            0.22 +
            positiveVoiceDifference *
              0.48 +
            emergencyPressure *
              0.2 +
            positiveEmergencyDifference *
              0.15 +
            normalizedDurationLoad *
              0.05 +
            trendPressure *
              0.2
        )
      );

    const level =
      scoreToLevel(
        driftScore
      );

    const confidence =
      profile.dataCoverage
        .confidence;

    const direction =
      getDirection(
        previousScore,
        driftScore
      );

    const drivers =
      createDrivers({
        voiceDifference,
        emergencyPressure,
        recentEmergencyCount:
          recentIncidents.length,
        trendPressure,
        confidence
      });

    const nextDataAction =
      getNextDataAction(
        profile.dataCoverage
      );

    let sentCommand =
      level;

    if (
      level === 'HIGH' &&
      confidence === 'LOW'
    ) {
      sentCommand =
        'MODERATE';

      drivers.push(
        'The hardware command was reduced to MODERATE because the twin has low data confidence.'
      );
    }

    let hardwareResponse = null;
    let hardwareError = '';
    let acknowledged = false;

    try {
      hardwareResponse =
        await sendArduinoCommandAndWait(
          sentCommand,
          3000
        );

      acknowledged = true;
    } catch (error) {
      hardwareError =
        error.message;
    }

    const snapshot =
      await DigitalTwinSnapshot.create({
        user:
          request.user._id,

        profile:
          profile._id,

        metrics: {
          voiceIrregularity:
            Math.round(
              latestVoiceScore
            ),

          emergencyPressure:
            Math.round(
              emergencyPressure
            ),

          recentEmergencyCount:
            recentIncidents.length,

          averageSessionDuration:
            Math.round(
              currentDuration
            ),

          trendPressure:
            Math.round(
              trendPressure
            )
        },

        comparison: {
          voiceDifference:
            Math.round(
              voiceDifference
            ),

          emergencyDifference:
            Math.round(
              emergencyDifference
            ),

          durationDifference:
            Math.round(
              durationDifference
            )
        },

        driftScore,
        level,
        confidence,
        direction,
        drivers,
        nextDataAction,

        nextRefreshWindow:
          getRefreshWindow(
            level
          ),

        hardware: {
          requestedCommand:
            level,

          sentCommand,

          acknowledged,

          response:
            hardwareResponse,

          error:
            hardwareError
        }
      });

    profile.lastSnapshotAt =
      new Date();

    await profile.save();

    await FeatureUsage.create({
      user:
        request.user._id,

      featureSlug:
        'ai-digital-twin',

      featureName:
        'AI Digital Twin',

      status: 'COMPLETED',

      startedAt:
        snapshot.createdAt,

      endedAt:
        new Date(),

      durationSeconds: 1,

      result: {
        level,

        summary:
          `Digital twin snapshot completed with a drift score of ${driftScore}.`,

        details:
          `Confidence: ${confidence}. Direction: ${direction}.`,

        hardware: {
          command:
            sentCommand,

          acknowledged,

          response:
            hardwareResponse,

          error:
            hardwareError
        }
      }
    });

    response.status(201).json({
      success: true,

      message: acknowledged
        ? `Digital twin snapshot completed and Arduino confirmed ${sentCommand}.`
        : 'Digital twin snapshot was saved, but Arduino did not confirm the command.',

      snapshot
    });
  } catch (error) {
    console.error(
      'Digital twin snapshot error:',
      error
    );

    response.status(500).json({
      success: false,
      message:
        'Digital twin snapshot could not be created.'
    });
  }
}

export async function simulateDigitalTwinScenario(
  request,
  response
) {
  try {
    if (
      !requireDatabase(
        response
      )
    ) {
      return;
    }

    const scenario =
      String(
        request.body.scenario ||
        ''
      ).toUpperCase();

    const definition =
      scenarioDefinitions[
        scenario
      ];

    if (!definition) {
      response.status(400).json({
        success: false,
        message:
          'The selected simulation scenario is invalid.'
      });

      return;
    }

    const profile =
      await DigitalTwinProfile
        .findOne({
          user:
            request.user._id
        });

    const latestSnapshot =
      await DigitalTwinSnapshot
        .findOne({
          user:
            request.user._id
        })
        .sort({
          createdAt: -1
        });

    if (
      !profile ||
      !latestSnapshot
    ) {
      response.status(400).json({
        success: false,
        message:
          'Create a current digital twin snapshot before running a simulation.'
      });

      return;
    }

    const projectedScore =
      Math.round(
        clamp(
          latestSnapshot
            .driftScore +
            definition
              .scoreModifier
        )
      );

    const projectedLevel =
      scoreToLevel(
        projectedScore
      );

    const result = {
      scenario,
      title:
        definition.title,

      description:
        definition.description,

      baseScore:
        latestSnapshot
          .driftScore,

      projectedScore,

      projectedLevel,

      difference:
        projectedScore -
        latestSnapshot
          .driftScore,

      confidence:
        profile.dataCoverage
          .confidence,

      note:
        'This is a non-clinical prototype simulation based on stored patterns. It does not predict a medical outcome.'
    };

    profile.simulationHistory.push({
      scenario,

      title:
        definition.title,

      baseScore:
        latestSnapshot
          .driftScore,

      projectedScore,
      projectedLevel
    });

    if (
      profile
        .simulationHistory
        .length >
      20
    ) {
      profile.simulationHistory =
        profile
          .simulationHistory
          .slice(-20);
    }

    await profile.save();

    response.json({
      success: true,
      simulation: result
    });
  } catch (error) {
    console.error(
      'Digital twin simulation error:',
      error
    );

    response.status(500).json({
      success: false,
      message:
        'Digital twin simulation could not be completed.'
    });
  }
}

export async function getDigitalTwinHistory(
  request,
  response
) {
  try {
    if (
      !requireDatabase(
        response
      )
    ) {
      return;
    }

    const snapshots =
      await DigitalTwinSnapshot
        .find({
          user:
            request.user._id
        })
        .sort({
          createdAt: -1
        })
        .limit(50)
        .lean();

    response.json({
      success: true,
      snapshots
    });
  } catch (error) {
    console.error(
      'Digital twin history error:',
      error
    );

    response.status(500).json({
      success: false,
      message:
        'Digital twin history could not be loaded.'
    });
  }
}