import mongoose from 'mongoose';

const arAssistantSessionSchema = new mongoose.Schema(
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
      default: null
    },

    mode: {
      type: String,
      enum: [
        'EMERGENCY_GUIDANCE',
        'POSTURE_GUIDANCE',
        'ROOM_SAFETY'
      ],
      required: true
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

    completedSteps: {
      type: [String],
      default: []
    },

    startedAt: {
      type: Date,
      default: Date.now
    },

    completedAt: {
      type: Date,
      default: null
    },

    durationSeconds: {
      type: Number,
      min: 0,
      default: 0
    },

    resultLevel: {
      type: String,
      enum: [
        'GOOD',
        'MODERATE',
        'HIGH',
        'COMPLETED'
      ],
      default: 'COMPLETED'
    }
  },
  {
    timestamps: true
  }
);

arAssistantSessionSchema.index({
  user: 1,
  createdAt: -1
});

export const ARAssistantSession = mongoose.model(
  'ARAssistantSession',
  arAssistantSessionSchema
);