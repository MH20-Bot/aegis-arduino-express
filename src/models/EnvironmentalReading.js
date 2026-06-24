import mongoose from 'mongoose';

const environmentalValuesSchema = new mongoose.Schema(
  {
    temperatureC: {
      type: Number,
      required: true,
      min: -20,
      max: 80
    },

    humidityPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },

    smokeLevel: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },

    airQualitySignal: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    }
  },
  {
    _id: false
  }
);

const componentLevelsSchema = new mongoose.Schema(
  {
    temperature: {
      type: String,
      enum: [
        'GOOD',
        'MODERATE',
        'HIGH'
      ],
      required: true
    },

    humidity: {
      type: String,
      enum: [
        'GOOD',
        'MODERATE',
        'HIGH'
      ],
      required: true
    },

    smoke: {
      type: String,
      enum: [
        'GOOD',
        'MODERATE',
        'HIGH'
      ],
      required: true
    },

    airQuality: {
      type: String,
      enum: [
        'GOOD',
        'MODERATE',
        'HIGH'
      ],
      required: true
    }
  },
  {
    _id: false
  }
);

const environmentalHardwareSchema = new mongoose.Schema(
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

const environmentalReadingSchema = new mongoose.Schema(
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

    source: {
      type: String,
      enum: [
        'MANUAL',
        'DEMO',
        'SENSOR'
      ],
      default: 'MANUAL'
    },

    readings: {
      type: environmentalValuesSchema,
      required: true
    },

    componentLevels: {
      type: componentLevelsSchema,
      required: true
    },

    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
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
      type: environmentalHardwareSchema,
      default: () => ({})
    },

    capturedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

environmentalReadingSchema.index({
  user: 1,
  createdAt: -1
});

export const EnvironmentalReading = mongoose.model(
  'EnvironmentalReading',
  environmentalReadingSchema
);