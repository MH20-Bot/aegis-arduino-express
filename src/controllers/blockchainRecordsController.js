import crypto from 'crypto';
import mongoose from 'mongoose';

import {
  BlockchainRecord
} from '../models/BlockchainRecord.js';

import {
  FeatureUsage
} from '../models/FeatureUsage.js';

function databaseIsReady() {
  return mongoose.connection.readyState === 1;
}

function createHash(value) {
  return crypto
    .createHash('sha256')
    .update(value)
    .digest('hex');
}

function normalizeLevel(value) {
  const allowedLevels = [
    'GOOD',
    'MODERATE',
    'HIGH',
    'NORMAL',
    'COMPLETED',
    'NOT_AVAILABLE'
  ];

  const normalizedValue = String(
    value || 'COMPLETED'
  ).toUpperCase();

  return allowedLevels.includes(
    normalizedValue
  )
    ? normalizedValue
    : 'COMPLETED';
}

function createPayload(record) {
  return JSON.stringify({
    sourceFeatureUsage: String(
      record.sourceFeatureUsage || ''
    ),

    sourceFeatureSlug:
      record.sourceFeatureSlug,

    featureName:
      record.featureName,

    eventType:
      record.eventType,

    level:
      record.level,

    summary:
      record.summary,

    eventAt:
      new Date(
        record.eventAt
      ).toISOString()
  });
}

export async function createBlockchainRecord(
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

    let sourceUsage = null;

    if (
      request.body.featureUsageId
    ) {
      sourceUsage =
        await FeatureUsage.findOne({
          _id:
            request.body.featureUsageId,

          user:
            request.user._id
        });
    }

    if (!sourceUsage) {
      sourceUsage =
        await FeatureUsage.findOne({
          user:
            request.user._id,

          status:
            'COMPLETED',

          featureSlug: {
            $ne:
              'blockchain-records'
          }
        }).sort({
          endedAt: -1,
          createdAt: -1
        });
    }

    if (!sourceUsage) {
      response.status(400).json({
        success: false,
        message:
          'Complete another health feature before creating a blockchain record.'
      });

      return;
    }

    const previousRecord =
      await BlockchainRecord.findOne({
        user:
          request.user._id
      }).sort({
        sequence: -1
      });

    const sequence =
      previousRecord
        ? previousRecord.sequence + 1
        : 1;

    const previousHash =
      previousRecord
        ? previousRecord.recordHash
        : 'GENESIS';

    const eventAt =
      sourceUsage.endedAt ||
      sourceUsage.createdAt ||
      new Date();

    const recordData = {
      sourceFeatureUsage:
        sourceUsage._id,

      sourceFeatureSlug:
        sourceUsage.featureSlug,

      featureName:
        sourceUsage.featureName ||
        sourceUsage.featureSlug,

      eventType:
        sourceUsage.featureSlug ===
        'ai-health-assistant'
          ? 'ASSISTANT_REPORT'
          : 'FEATURE_RESULT',

      level:
        normalizeLevel(
          sourceUsage.result?.level
        ),

      summary:
        sourceUsage.result?.summary ||
        'A completed feature result was recorded.',

      eventAt
    };

    const payloadHash =
      createHash(
        createPayload(
          recordData
        )
      );

    const recordHash =
      createHash(
        `${sequence}|${previousHash}|${payloadHash}`
      );

    const record =
      await BlockchainRecord.create({
        user:
          request.user._id,

        sequence,
        previousHash,
        payloadHash,
        recordHash,
        ...recordData
      });

    response.status(201).json({
      success: true,
      message:
        'A tamper evident health record was added to the cryptographic chain.',
      record
    });
  } catch (error) {
    console.error(
      'Blockchain record creation error:',
      error
    );

    response.status(500).json({
      success: false,
      message:
        'The blockchain record could not be created.'
    });
  }
}

export async function listBlockchainRecords(
  request,
  response
) {
  try {
    const records =
      await BlockchainRecord.find({
        user:
          request.user._id
      })
        .sort({
          sequence: -1
        })
        .limit(100)
        .lean();

    response.json({
      success: true,
      records
    });
  } catch (error) {
    console.error(
      'Blockchain record list error:',
      error
    );

    response.status(500).json({
      success: false,
      message:
        'Blockchain records could not be loaded.'
    });
  }
}

export async function verifyBlockchainRecords(
  request,
  response
) {
  try {
    const records =
      await BlockchainRecord.find({
        user:
          request.user._id
      })
        .sort({
          sequence: 1
        })
        .lean();

    const issues = [];
    let expectedPreviousHash =
      'GENESIS';

    for (
      let index = 0;
      index < records.length;
      index += 1
    ) {
      const record =
        records[index];

      const calculatedPayloadHash =
        createHash(
          createPayload(
            record
          )
        );

      const calculatedRecordHash =
        createHash(
          `${record.sequence}|${record.previousHash}|${calculatedPayloadHash}`
        );

      if (
        record.previousHash !==
        expectedPreviousHash
      ) {
        issues.push({
          sequence:
            record.sequence,

          message:
            'The previous hash does not match the chain.'
        });
      }

      if (
        record.payloadHash !==
        calculatedPayloadHash
      ) {
        issues.push({
          sequence:
            record.sequence,

          message:
            'The stored health payload has changed.'
        });
      }

      if (
        record.recordHash !==
        calculatedRecordHash
      ) {
        issues.push({
          sequence:
            record.sequence,

          message:
            'The record hash is invalid.'
        });
      }

      expectedPreviousHash =
        record.recordHash;
    }

    response.json({
      success: true,

      verification: {
        valid:
          issues.length === 0,

        totalRecords:
          records.length,

        issues,

        checkedAt:
          new Date()
      }
    });
  } catch (error) {
    console.error(
      'Blockchain verification error:',
      error
    );

    response.status(500).json({
      success: false,
      message:
        'The cryptographic chain could not be verified.'
    });
  }
}