import mongoose from 'mongoose';

const baselineSchema = new mongoose.Schema(
  {
    voiceIrregularity: {
      type: Number,
      min: 0,
      max: 100,
      default: 20
    },

    emergencyPressure: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },

    averageSessionDuration: {
      type: Number,
      min: 0,
      default: 0
    },

    stabilityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 80
    }
  },
  {
    _id: false
  }
);

const dataCoverageSchema = new mongoose.Schema(
  {
    totalRecords: {
      type: Number,
      min: 0,
      default: 0
    },

    voiceSamples: {
      type: Number,
      min: 0,
      default: 0
    },

    emergencyIncidents: {
      type: Number,
      min: 0,
      default: 0
    },

    wearableSamples: {
      type: Number,
      min: 0,
      default: 0
    },

    environmentalSamples: {
      type: Number,
      min: 0,
      default: 0
    },

    confidence: {
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

const simulationHistorySchema =
  new mongoose.Schema(
    {
      scenario: {
        type: String,
        required: true
      },

      title: {
        type: String,
        required: true
      },

      baseScore: {
        type: Number,
        min: 0,
        max: 100,
        required: true
      },

      projectedScore: {
        type: Number,
        min: 0,
        max: 100,
        required: true
      },

      projectedLevel: {
        type: String,
        enum: [
          'GOOD',
          'MODERATE',
          'HIGH'
        ],
        required: true
      },

      createdAt: {
        type: Date,
        default: Date.now
      }
    },
    {
      _id: true
    }
  );

const digitalTwinProfileSchema =
  new mongoose.Schema(
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
      },

      status: {
        type: String,
        enum: [
          'NOT_BUILT',
          'BUILDING',
          'ACTIVE',
          'LIMITED_DATA'
        ],
        default: 'NOT_BUILT'
      },

      baseline: {
        type: baselineSchema,
        default: () => ({})
      },

      dataCoverage: {
        type: dataCoverageSchema,
        default: () => ({})
      },

      simulationHistory: {
        type: [simulationHistorySchema],
        default: []
      },

      lastBuiltAt: {
        type: Date,
        default: null
      },

      lastSnapshotAt: {
        type: Date,
        default: null
      },

      disclaimerAccepted: {
        type: Boolean,
        default: false
      }
    },
    {
      timestamps: true
    }
  );

export const DigitalTwinProfile =
  mongoose.model(
    'DigitalTwinProfile',
    digitalTwinProfileSchema
  );