import mongoose from 'mongoose';

const twinMetricsSchema =
  new mongoose.Schema(
    {
      voiceIrregularity: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },

      emergencyPressure: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },

      recentEmergencyCount: {
        type: Number,
        min: 0,
        default: 0
      },

      averageSessionDuration: {
        type: Number,
        min: 0,
        default: 0
      },

      trendPressure: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      }
    },
    {
      _id: false
    }
  );

const comparisonSchema =
  new mongoose.Schema(
    {
      voiceDifference: {
        type: Number,
        default: 0
      },

      emergencyDifference: {
        type: Number,
        default: 0
      },

      durationDifference: {
        type: Number,
        default: 0
      }
    },
    {
      _id: false
    }
  );

const nextDataActionSchema =
  new mongoose.Schema(
    {
      featureSlug: {
        type: String,
        default: ''
      },

      title: {
        type: String,
        default: ''
      },

      reason: {
        type: String,
        default: ''
      },

      priority: {
        type: String,
        enum: [
          'LOW',
          'MEDIUM',
          'HIGH'
        ],
        default: 'LOW'
      }
    },
    {
      _id: false
    }
  );

const hardwareSchema =
  new mongoose.Schema(
    {
      requestedCommand: {
        type: String,
        enum: [
          'GOOD',
          'MODERATE',
          'HIGH',
          'OFF',
          'NONE'
        ],
        default: 'NONE'
      },

      sentCommand: {
        type: String,
        enum: [
          'GOOD',
          'MODERATE',
          'HIGH',
          'OFF',
          'NONE'
        ],
        default: 'NONE'
      },

      acknowledged: {
        type: Boolean,
        default: false
      },

      response: {
        type: mongoose.Schema.Types.Mixed,
        default: null
      },

      error: {
        type: String,
        default: ''
      }
    },
    {
      _id: false
    }
  );

const digitalTwinSnapshotSchema =
  new mongoose.Schema(
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
      },

      profile: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DigitalTwinProfile',
        required: true,
        index: true
      },

      metrics: {
        type: twinMetricsSchema,
        default: () => ({})
      },

      comparison: {
        type: comparisonSchema,
        default: () => ({})
      },

      driftScore: {
        type: Number,
        min: 0,
        max: 100,
        required: true
      },

      level: {
        type: String,
        enum: [
          'GOOD',
          'MODERATE',
          'HIGH'
        ],
        required: true
      },

      confidence: {
        type: String,
        enum: [
          'LOW',
          'MEDIUM',
          'HIGH'
        ],
        required: true
      },

      direction: {
        type: String,
        enum: [
          'IMPROVING',
          'STABLE',
          'RISING'
        ],
        default: 'STABLE'
      },

      drivers: {
        type: [String],
        default: []
      },

      nextDataAction: {
        type: nextDataActionSchema,
        default: () => ({})
      },

      nextRefreshWindow: {
        type: String,
        enum: [
          '30_MINUTES',
          '6_HOURS',
          '24_HOURS'
        ],
        default: '24_HOURS'
      },

      hardware: {
        type: hardwareSchema,
        default: () => ({})
      }
    },
    {
      timestamps: true
    }
  );

digitalTwinSnapshotSchema.index({
  user: 1,
  createdAt: -1
});

export const DigitalTwinSnapshot =
  mongoose.model(
    'DigitalTwinSnapshot',
    digitalTwinSnapshotSchema
  );