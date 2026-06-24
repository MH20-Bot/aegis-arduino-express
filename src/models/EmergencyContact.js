import mongoose from 'mongoose';

const emergencyContactSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },

    relationship: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },

    phone: {
      type: String,
      trim: true,
      maxlength: 40,
      default: ''
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 160,
      default: ''
    },

    priority: {
      type: Number,
      min: 1,
      max: 5,
      default: 1,
      index: true
    },

    preferredMethod: {
      type: String,
      enum: ['CALL', 'EMAIL', 'SHARE'],
      default: 'SHARE'
    },

    allowLocation: {
      type: Boolean,
      default: true
    },

    allowHealthSummary: {
      type: Boolean,
      default: false
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

emergencyContactSchema.index({
  user: 1,
  priority: 1,
  createdAt: 1
});

export const EmergencyContact = mongoose.model(
  'EmergencyContact',
  emergencyContactSchema
);