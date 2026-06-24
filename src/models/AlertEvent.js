import mongoose from 'mongoose';

const alertEventSchema = new mongoose.Schema(
  {
    level: {
      type: String,
      enum: [
        'GOOD',
        'MODERATE',
        'HIGH',
        'OFF'
      ],
      required: true,
      index: true
    },

    source: {
      type: String,
      enum: [
        'frontend',
        'arduino',
        'system'
      ],
      default: 'frontend'
    },

    commandSent: {
      type: Boolean,
      default: false
    },

    arduinoConnected: {
      type: Boolean,
      default: false
    },

    message: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

export const AlertEvent = mongoose.model(
  'AlertEvent',
  alertEventSchema
);