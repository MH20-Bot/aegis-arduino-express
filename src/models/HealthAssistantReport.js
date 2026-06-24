import mongoose from 'mongoose';

const sourceSummarySchema = new mongoose.Schema(
  {
    featureSlug: {
      type: String,
      required: true
    },

    featureName: {
      type: String,
      required: true
    },

    level: {
      type: String,
      required: true
    },

    score: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },

    summary: {
      type: String,
      default: ''
    },

    recordedAt: {
      type: Date,
      default: null
    }
  },
  {
    _id: false
  }
);

const hardwareSchema = new mongoose.Schema(
  {
    command: {
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

const healthAssistantReportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    sourceCount: {
      type: Number,
      min: 0,
      required: true
    },

    sources: {
      type: [sourceSummarySchema],
      default: []
    },

    overallScore: {
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

    summary: {
      type: String,
      required: true
    },

    actions: {
      type: [String],
      default: []
    },

    nextFeatureSlug: {
      type: String,
      default: ''
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

healthAssistantReportSchema.index({
  user: 1,
  createdAt: -1
});

export const HealthAssistantReport = mongoose.model(
  'HealthAssistantReport',
  healthAssistantReportSchema
);