import mongoose from 'mongoose';

import {
  EnvironmentalReading
} from '../models/EnvironmentalReading.js';

import {
  FeatureUsage
} from '../models/FeatureUsage.js';

import {
  sendArduinoCommandAndWait
} from '../services/arduinoService.js';

function databaseIsReady() {
  return mongoose.connection.readyState === 1;
}

function clamp(
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

function temperatureRisk(
  temperatureC
) {
  if (
    temperatureC <= 14 ||
    temperatureC >= 36
  ) {
    return 80;
  }

  if (
    temperatureC < 18 ||
    temperatureC > 30
  ) {
    return 45;
  }

  return 10;
}

function humidityRisk(
  humidityPercent
) {
  if (
    humidityPercent < 20 ||
    humidityPercent > 80
  ) {
    return 75;
  }

  if (
    humidityPercent < 30 ||
    humidityPercent > 65
  ) {
    return 45;
  }

  return 10;
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

function createSummary(
  level,
  riskScore
) {
  if (level === 'HIGH') {
    return (
      'A high environmental warning was detected. ' +
      `The environmental risk score is ${riskScore}.`
    );
  }

  if (level === 'MODERATE') {
    return (
      'A moderate environmental warning was detected. ' +
      `The environmental risk score is ${riskScore}.`
    );
  }

  return (
    'The current room conditions are within the prototype safe range. ' +
    `The environmental risk score is ${riskScore}.`
  );
}

function createGuidance({
  temperatureC,
  humidityPercent,
  smokeLevel,
  airQualitySignal
}) {
  const guidance = [];

  if (temperatureC > 30) {
    guidance.push(
      'Reduce the room temperature and improve ventilation.'
    );
  }

  if (temperatureC < 18) {
    guidance.push(
      'Increase the room temperature to a more comfortable range.'
    );
  }

  if (humidityPercent > 65) {
    guidance.push(
      'Reduce excess humidity and improve airflow.'
    );
  }

  if (humidityPercent < 30) {
    guidance.push(
      'The room air is dry. Consider increasing humidity carefully.'
    );
  }

  if (smokeLevel >= 65) {
    guidance.push(
      'A strong smoke signal was detected. Leave the area and follow the local emergency procedure.'
    );
  } else if (smokeLevel >= 35) {
    guidance.push(
      'A moderate smoke signal was detected. Check the room safely.'
    );
  }

  if (airQualitySignal >= 65) {
    guidance.push(
      'The air quality signal is poor. Improve ventilation and avoid prolonged exposure.'
    );
  } else if (airQualitySignal >= 35) {
    guidance.push(
      'The air quality signal is elevated. Open ventilation where safe.'
    );
  }

  if (!guidance.length) {
    guidance.push(
      'Current environmental readings remain within the prototype normal range.'
    );
  }

  return guidance;
}

export async function analyzeEnvironment(
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

    const temperatureC = clamp(
      request.body.temperatureC,
      -20,
      80
    );

    const humidityPercent = clamp(
      request.body.humidityPercent,
      0,
      100
    );

    const smokeLevel = clamp(
      request.body.smokeLevel,
      0,
      100
    );

    const airQualitySignal = clamp(
      request.body.airQualitySignal,
      0,
      100
    );

    const requestedSource = String(
      request.body.source || 'MANUAL'
    ).toUpperCase();

    const allowedSources = [
      'MANUAL',
      'DEMO',
      'SENSOR'
    ];

    const source = allowedSources.includes(
      requestedSource
    )
      ? requestedSource
      : 'MANUAL';

    const temperatureScore =
      temperatureRisk(
        temperatureC
      );

    const humidityScore =
      humidityRisk(
        humidityPercent
      );

    const riskScore = Math.round(
      Math.max(
        temperatureScore,
        humidityScore,
        smokeLevel,
        airQualitySignal
      )
    );

    const componentLevels = {
      temperature:
        scoreToLevel(
          temperatureScore
        ),

      humidity:
        scoreToLevel(
          humidityScore
        ),

      smoke:
        scoreToLevel(
          smokeLevel
        ),

      airQuality:
        scoreToLevel(
          airQualitySignal
        )
    };

    const level =
      scoreToLevel(
        riskScore
      );

    const readings = {
      temperatureC,
      humidityPercent,
      smokeLevel,
      airQualitySignal
    };

    const summary =
      createSummary(
        level,
        riskScore
      );

    const guidance =
      createGuidance(
        readings
      );

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
      hardwareError =
        error.message;
    }

    const completedAt = new Date();

    const startedAt = new Date(
      completedAt.getTime() -
        1000
    );

    const featureUsage =
      await FeatureUsage.create({
        user:
          request.user._id,

        featureSlug:
          'smart-home-sensors',

        featureName:
          'AI Environmental Health Monitor',

        status:
          'COMPLETED',

        startedAt,
        endedAt:
          completedAt,

        durationSeconds:
          1,

        result: {
          level,
          summary,

          details:
            `Temperature: ${temperatureC} C. ` +
            `Humidity: ${humidityPercent} percent. ` +
            `Smoke signal: ${smokeLevel}. ` +
            `Air quality signal: ${airQualitySignal}.`,

          hardware: {
            command:
              level,

            acknowledged:
              hardwareAcknowledged,

            response:
              hardwareResponse,

            error:
              hardwareError
          }
        }
      });

    const reading =
      await EnvironmentalReading.create({
        user:
          request.user._id,

        featureUsage:
          featureUsage._id,

        source,
        readings,
        componentLevels,
        riskScore,
        level,
        summary,
        guidance,

        hardware: {
          command:
            level,

          acknowledged:
            hardwareAcknowledged,

          response:
            hardwareResponse,

          error:
            hardwareError
        },

        capturedAt:
          completedAt
      });

    response.status(201).json({
      success: true,

      message:
        hardwareAcknowledged
          ? `Environmental analysis completed and Arduino confirmed ${level}.`
          : 'Environmental analysis was saved, but Arduino did not confirm the command.',

      reading
    });
  } catch (error) {
    console.error(
      'Environmental analysis error:',
      error
    );

    response.status(500).json({
      success: false,
      message:
        'Environmental analysis could not be completed.'
    });
  }
}

export async function getEnvironmentalHistory(
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

    const readings =
      await EnvironmentalReading.find({
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
      readings
    });
  } catch (error) {
    console.error(
      'Environmental history error:',
      error
    );

    response.status(500).json({
      success: false,
      message:
        'Environmental history could not be loaded.'
    });
  }
}