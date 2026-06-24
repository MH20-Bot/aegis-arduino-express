import mongoose from 'mongoose';

const featureMetricsSchema = new mongoose.Schema(
  {
    averageVolume: {
      type: Number,
      default: 0,
      min: 0
    },

    peakVolume: {
      type: Number,
      default: 0,
      min: 0
    },

    silenceRatio: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },

    volumeVariation: {
      type: Number,
      default: 0,
      min: 0
    },

    clippingRatio: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },

    sampleCount: {
      type: Number,
      default: 0,
      min: 0
    },

    irregularityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    signalQuality: {
      type: String,
      enum: [
        'GOOD',
        'LIMITED',
        'UNSTABLE',
        'NOT_AVAILABLE'
      ],
      default: 'NOT_AVAILABLE'
    }
  },
  {
    _id: false
  }
);

const hardwareResultSchema = new mongoose.Schema(
  {
    command: {
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

const featureResultSchema = new mongoose.Schema(
  {
    summary: {
      type: String,
      trim: true,
      default: ''
    },

    level: {
      type: String,
      enum: [
        'GOOD',
        'MODERATE',
        'HIGH',
        'NORMAL',
        'COMPLETED',
        'NOT_AVAILABLE'
      ],
      default: 'COMPLETED'
    },

    details: {
      type: String,
      trim: true,
      default: ''
    },

    metrics: {
      type: featureMetricsSchema,
      default: () => ({})
    },

    hardware: {
      type: hardwareResultSchema,
      default: () => ({})
    }
  },
  {
    _id: false
  }
);

const featureUsageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    featureSlug: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    featureName: {
      type: String,
      required: true,
      trim: true
    },

    status: {
      type: String,
      enum: [
        'STARTED',
        'COMPLETED',
        'CANCELLED'
      ],
      default: 'STARTED'
    },

    startedAt: {
      type: Date,
      required: true,
      default: Date.now
    },

    endedAt: {
      type: Date,
      default: null
    },

    durationSeconds: {
      type: Number,
      default: 0,
      min: 0
    },

    result: {
      type: featureResultSchema,
      default: () => ({})
    }
  },
  {
    timestamps: true
  }
);

featureUsageSchema.index({
  user: 1,
  createdAt: -1
});

featureUsageSchema.index({
  user: 1,
  featureSlug: 1,
  createdAt: -1
});

export const FeatureUsage = mongoose.model(
  'FeatureUsage',
  featureUsageSchema
);