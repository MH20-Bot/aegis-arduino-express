

import mongoose from 'mongoose';

const postureAnglesSchema = new mongoose.Schema(
  {
    shoulderTilt: {
      type: Number,
      min: 0,
      max: 90,
      default: 0
    },

    headTilt: {
      type: Number,
      min: 0,
      max: 90,
      default: 0
    },

    torsoLean: {
      type: Number,
      min: 0,
      max: 90,
      default: 0
    },

    hipTilt: {
      type: Number,
      min: 0,
      max: 90,
      default: 0
    }
  },
  {
    _id: false
  }
);

const postureMeasurementsSchema = new mongoose.Schema(
  {
    average: {
      type: postureAnglesSchema,
      default: () => ({})
    },

    maximum: {
      type: postureAnglesSchema,
      default: () => ({})
    },

    stabilityScore: {
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

const postureHardwareSchema = new mongoose.Schema(
  {
    requestedCommand: {
      type: String,
      enum: [
        'GOOD',
        'MODERATE',
        'HIGH',
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

const postureAnalysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    featureUsage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeatureUsage',
      required: true,
      index: true
    },

    startedAt: {
      type: Date,
      required: true
    },

    completedAt: {
      type: Date,
      required: true
    },

    durationSeconds: {
      type: Number,
      min: 1,
      max: 120,
      required: true
    },

    frameCount: {
      type: Number,
      min: 1,
      required: true
    },

    poseConfidence: {
      type: Number,
      min: 0,
      max: 1,
      required: true
    },

    baseline: {
      type: postureAnglesSchema,
      required: true
    },

    measurements: {
      type: postureMeasurementsSchema,
      required: true
    },

    differences: {
      type: postureAnglesSchema,
      required: true
    },

    postureScore: {
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

    summary: {
      type: String,
      required: true,
      maxlength: 500
    },

    guidance: {
      type: [String],
      default: []
    },

    hardware: {
      type: postureHardwareSchema,
      default: () => ({})
    }
  },
  {
    timestamps: true
  }
);

postureAnalysisSchema.index({
  user: 1,
  createdAt: -1
});

export const PostureAnalysis = mongoose.model(
  'PostureAnalysis',
  postureAnalysisSchema
);



