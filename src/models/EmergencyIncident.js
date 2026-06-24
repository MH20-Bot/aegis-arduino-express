import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    permissionStatus: {
      type: String,
      enum: [
        'NOT_REQUESTED',
        'GRANTED',
        'DENIED',
        'UNAVAILABLE'
      ],
      default: 'NOT_REQUESTED'
    },

    latitude: {
      type: Number,
      default: null
    },

    longitude: {
      type: Number,
      default: null
    },

    accuracyMeters: {
      type: Number,
      default: null
    },

    capturedAt: {
      type: Date,
      default: null
    },

    mapUrl: {
      type: String,
      default: ''
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
    },

    updatedAt: {
      type: Date,
      default: null
    }
  },
  {
    _id: false
  }
);

const timelineEventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      trim: true
    },

    level: {
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

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },

    createdAt: {
      type: Date,
      default: Date.now
    }
  }
);

const contactAlertSchema = new mongoose.Schema(
  {
    contact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmergencyContact',
      required: true
    },

    name: {
      type: String,
      required: true
    },

    relationship: {
      type: String,
      default: ''
    },

    phone: {
      type: String,
      default: ''
    },

    email: {
      type: String,
      default: ''
    },

    priority: {
      type: Number,
      min: 1,
      max: 5,
      default: 1
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

    status: {
      type: String,
      enum: [
        'PENDING',
        'LINK_CREATED',
        'OPENED',
        'ACKNOWLEDGED',
        'DECLINED'
      ],
      default: 'PENDING'
    },

    tokenHash: {
  type: String,
  default: ''
},

    tokenExpiresAt: {
      type: Date,
      default: null
    },

    openedAt: {
      type: Date,
      default: null
    },

    acknowledgedAt: {
      type: Date,
      default: null
    },

    response: {
      type: String,
      enum: [
        '',
        'RESPONDING',
        'CANNOT_RESPOND'
      ],
      default: ''
    },

    createdAt: {
      type: Date,
      default: Date.now
    }
  }
);

const emergencyIncidentSchema = new mongoose.Schema(
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

    status: {
      type: String,
      enum: [
        'ACTIVE',
        'ACKNOWLEDGED',
        'RESOLVED',
        'CANCELLED'
      ],
      default: 'ACTIVE',
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
      default: 'OFF'
    },

    note: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: ''
    },

    startedAt: {
      type: Date,
      default: Date.now
    },

    resolvedAt: {
      type: Date,
      default: null
    },

    location: {
      type: locationSchema,
      default: () => ({})
    },

    hardware: {
      type: hardwareSchema,
      default: () => ({})
    },

    timeline: {
      type: [timelineEventSchema],
      default: []
    },

    contactAlerts: {
      type: [contactAlertSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

emergencyIncidentSchema.index({
  user: 1,
  status: 1,
  startedAt: -1
});

emergencyIncidentSchema.index({
  'contactAlerts.tokenHash': 1
});

export const EmergencyIncident = mongoose.model(
  'EmergencyIncident',
  emergencyIncidentSchema
);