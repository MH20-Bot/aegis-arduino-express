import mongoose from 'mongoose';

const blockchainRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    sequence: {
      type: Number,
      required: true,
      min: 1
    },

    previousHash: {
      type: String,
      required: true,
      default: 'GENESIS'
    },

    payloadHash: {
      type: String,
      required: true
    },

    recordHash: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    sourceFeatureUsage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeatureUsage',
      default: null
    },

    sourceFeatureSlug: {
      type: String,
      required: true
    },

    featureName: {
      type: String,
      required: true
    },

    eventType: {
      type: String,
      enum: [
        'FEATURE_RESULT',
        'ASSISTANT_REPORT',
        'SYSTEM_EVENT'
      ],
      default: 'FEATURE_RESULT'
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

    summary: {
      type: String,
      required: true,
      maxlength: 1000
    },

    eventAt: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

blockchainRecordSchema.index(
  {
    user: 1,
    sequence: 1
  },
  {
    unique: true
  }
);

blockchainRecordSchema.index({
  user: 1,
  createdAt: -1
});

export const BlockchainRecord = mongoose.model(
  'BlockchainRecord',
  blockchainRecordSchema
);


