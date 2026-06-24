import mongoose from 'mongoose';

const emergencyAlertEventSchema =
  new mongoose.Schema(
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

      level: {
        type: String,
        enum: [
          'GOOD',
          'MODERATE',
          'HIGH',
          'OFF'
        ],
        required: true
      },

      note: {
        type: String,
        trim: true,
        maxlength: 500,
        default: ''
      },

      hardwareAcknowledged: {
        type: Boolean,
        default: false
      },

      hardwareResponse: {
        type: mongoose.Schema.Types.Mixed,
        default: null
      },

      hardwareError: {
        type: String,
        default: ''
      }
    },
    {
      timestamps: true
    }
  );

emergencyAlertEventSchema.index({
  user: 1,
  featureUsage: 1,
  createdAt: -1
});

export const EmergencyAlertEvent =
  mongoose.model(
    'EmergencyAlertEvent',
    emergencyAlertEventSchema
  );