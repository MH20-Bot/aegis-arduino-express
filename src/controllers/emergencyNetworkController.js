import crypto from 'crypto';
import mongoose from 'mongoose';

import {
  EmergencyContact
} from '../models/EmergencyContact.js';

import {
  EmergencyIncident
} from '../models/EmergencyIncident.js';

import {
  FeatureUsage
} from '../models/FeatureUsage.js';

import {
  getArduinoStatus,
  sendArduinoCommandAndWait
} from '../services/arduinoService.js';

const allowedLevels = new Set([
  'GOOD',
  'MODERATE',
  'HIGH',
  'OFF'
]);

const allowedContactResponses = new Set([
  'RESPONDING',
  'CANNOT_RESPOND'
]);

function databaseIsReady() {
  return mongoose.connection.readyState === 1;
}

function requireDatabase(response) {
  if (databaseIsReady()) {
    return true;
  }

  response.status(503).json({
    success: false,
    message:
      'Database connection is not available.'
  });

  return false;
}

function cleanString(
  value,
  maximumLength = 500
) {
  return String(value || '')
    .trim()
    .slice(0, maximumLength);
}

function normalizeEmail(value) {
  return cleanString(
    value,
    160
  ).toLowerCase();
}

function normalizeLocation(
  rawLocation
) {
  if (
    !rawLocation ||
    typeof rawLocation !== 'object'
  ) {
    return {
      permissionStatus:
        'NOT_REQUESTED',

      latitude: null,
      longitude: null,
      accuracyMeters: null,
      capturedAt: null,
      mapUrl: ''
    };
  }

  const allowedPermissionStatuses = [
    'NOT_REQUESTED',
    'GRANTED',
    'DENIED',
    'UNAVAILABLE'
  ];

  const permissionStatus =
    allowedPermissionStatuses.includes(
      rawLocation.permissionStatus
    )
      ? rawLocation.permissionStatus
      : 'UNAVAILABLE';

  const latitude = Number(
    rawLocation.latitude
  );

  const longitude = Number(
    rawLocation.longitude
  );

  const accuracyMeters = Number(
    rawLocation.accuracyMeters
  );

  const coordinatesAreValid =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180;

  return {
    permissionStatus,

    latitude:
      coordinatesAreValid
        ? latitude
        : null,

    longitude:
      coordinatesAreValid
        ? longitude
        : null,

    accuracyMeters:
      Number.isFinite(
        accuracyMeters
      ) &&
      accuracyMeters >= 0
        ? accuracyMeters
        : null,

    capturedAt:
      coordinatesAreValid
        ? rawLocation.capturedAt
          ? new Date(
              rawLocation.capturedAt
            )
          : new Date()
        : null,

    mapUrl:
      coordinatesAreValid
        ? `https://www.google.com/maps?q=${latitude},${longitude}`
        : ''
  };
}

function createContactSnapshot(
  contact
) {
  return {
    contact: contact._id,
    name: contact.name,
    relationship:
      contact.relationship,
    phone: contact.phone,
    email: contact.email,
    priority: contact.priority,
    preferredMethod:
      contact.preferredMethod,
    allowLocation:
      contact.allowLocation,
    allowHealthSummary:
      contact.allowHealthSummary,
    status: 'PENDING'
  };
}

function sanitizeIncident(
  document
) {
  if (!document) {
    return null;
  }

  const incident =
    typeof document.toObject ===
    'function'
      ? document.toObject()
      : document;

  incident.contactAlerts =
    (
      incident.contactAlerts ||
      []
    ).map(alert => {
      const safeAlert = {
        ...alert
      };

      delete safeAlert.tokenHash;

      return safeAlert;
    });

  return incident;
}

function hashToken(token) {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
}

function getHighestTimelineLevel(
  timeline
) {
  const priorities = {
    OFF: 0,
    GOOD: 1,
    MODERATE: 2,
    HIGH: 3
  };

  let highestLevel =
    'COMPLETED';

  let highestPriority = 0;

  for (
    const event of timeline || []
  ) {
    const priority =
      priorities[event.level] ||
      0;

    if (
      priority >
      highestPriority
    ) {
      highestPriority =
        priority;

      highestLevel =
        event.level;
    }
  }

  return highestLevel;
}

export async function listEmergencyContacts(
  request,
  response
) {
  try {
    if (!requireDatabase(response)) {
      return;
    }

    const contacts =
      await EmergencyContact.find({
        user: request.user._id
      })
        .sort({
          isActive: -1,
          priority: 1,
          createdAt: 1
        })
        .lean();

    response.json({
      success: true,
      contacts
    });
  } catch (error) {
    console.error(
      'Emergency contact list error:',
      error
    );

    response.status(500).json({
      success: false,
      message:
        'Emergency contacts could not be loaded.'
    });
  }
}

export async function createEmergencyContact(
  request,
  response
) {
  try {
    if (!requireDatabase(response)) {
      return;
    }

    const name = cleanString(
      request.body.name,
      100
    );

    const relationship =
      cleanString(
        request.body.relationship,
        80
      );

    const phone = cleanString(
      request.body.phone,
      40
    );

    const email =
      normalizeEmail(
        request.body.email
      );

    if (
      !name ||
      !relationship
    ) {
      response.status(400).json({
        success: false,
        message:
          'Name and relationship are required.'
      });

      return;
    }

    if (!phone && !email) {
      response.status(400).json({
        success: false,
        message:
          'At least one phone number or email address is required.'
      });

      return;
    }

    const contact =
      await EmergencyContact.create({
        user: request.user._id,
        name,
        relationship,
        phone,
        email,

        priority: Math.min(
          5,
          Math.max(
            1,
            Number(
              request.body.priority
            ) || 1
          )
        ),

        preferredMethod: [
          'CALL',
          'EMAIL',
          'SHARE'
        ].includes(
          request.body
            .preferredMethod
        )
          ? request.body
              .preferredMethod
          : 'SHARE',

        allowLocation:
          request.body
            .allowLocation !==
          false,

        allowHealthSummary:
          request.body
            .allowHealthSummary ===
          true,

        isActive:
          request.body.isActive !==
          false
      });

    response.status(201).json({
      success: true,
      message:
        'Emergency contact created successfully.',
      contact
    });
  } catch (error) {
    console.error(
      'Emergency contact creation error:',
      error
    );

    response.status(500).json({
      success: false,
      message:
        'Emergency contact could not be created.'
    });
  }
}

export async function updateEmergencyContact(
  request,
  response
) {
  try {
    if (!requireDatabase(response)) {
      return;
    }

    const contact =
      await EmergencyContact.findOne({
        _id:
          request.params
            .contactId,

        user:
          request.user._id
      });

    if (!contact) {
      response.status(404).json({
        success: false,
        message:
          'Emergency contact was not found.'
      });

      return;
    }

    if (
      request.body.name !==
      undefined
    ) {
      contact.name =
        cleanString(
          request.body.name,
          100
        );
    }

    if (
      request.body.relationship !==
      undefined
    ) {
      contact.relationship =
        cleanString(
          request.body
            .relationship,
          80
        );
    }

    if (
      request.body.phone !==
      undefined
    ) {
      contact.phone =
        cleanString(
          request.body.phone,
          40
        );
    }

    if (
      request.body.email !==
      undefined
    ) {
      contact.email =
        normalizeEmail(
          request.body.email
        );
    }

    if (
      request.body.priority !==
      undefined
    ) {
      contact.priority =
        Math.min(
          5,
          Math.max(
            1,
            Number(
              request.body
                .priority
            ) || 1
          )
        );
    }

    if (
      [
        'CALL',
        'EMAIL',
        'SHARE'
      ].includes(
        request.body
          .preferredMethod
      )
    ) {
      contact.preferredMethod =
        request.body
          .preferredMethod;
    }

    if (
      request.body
        .allowLocation !==
      undefined
    ) {
      contact.allowLocation =
        Boolean(
          request.body
            .allowLocation
        );
    }

    if (
      request.body
        .allowHealthSummary !==
      undefined
    ) {
      contact.allowHealthSummary =
        Boolean(
          request.body
            .allowHealthSummary
        );
    }

    if (
      request.body.isActive !==
      undefined
    ) {
      contact.isActive =
        Boolean(
          request.body.isActive
        );
    }

    if (
      !contact.name ||
      !contact.relationship
    ) {
      response.status(400).json({
        success: false,
        message:
          'Name and relationship are required.'
      });

      return;
    }

    if (
      !contact.phone &&
      !contact.email
    ) {
      response.status(400).json({
        success: false,
        message:
          'At least one phone number or email address is required.'
      });

      return;
    }

    await contact.save();

    response.json({
      success: true,
      message:
        'Emergency contact updated successfully.',
      contact
    });
  } catch (error) {
    console.error(
      'Emergency contact update error:',
      error
    );

    response.status(500).json({
      success: false,
      message:
        'Emergency contact could not be updated.'
    });
  }
}

export async function deleteEmergencyContact(
  request,
  response
) {
  try {
    if (!requireDatabase(response)) {
      return;
    }

    const deletedContact =
      await EmergencyContact
        .findOneAndDelete({
          _id:
            request.params
              .contactId,

          user:
            request.user._id
        });

    if (!deletedContact) {
      response.status(404).json({
        success: false,
        message:
          'Emergency contact was not found.'
      });

      return;
    }

    response.json({
      success: true,
      message:
        'Emergency contact deleted successfully.'
    });
  } catch (error) {
    console.error(
      'Emergency contact deletion error:',
      error
    );

    response.status(500).json({
      success: false,
      message:
        'Emergency contact could not be deleted.'
    });
  }
}

export function readEmergencyHardwareStatus(
  request,
  response
) {
  response.json({
    success: true,
    ...getArduinoStatus()
  });
}

export async function getActiveEmergencyIncident(
  request,
  response
) {
  try {
    if (!requireDatabase(response)) {
      return;
    }

    const incident =
      await EmergencyIncident.findOne({
        user: request.user._id,

        status: {
          $in: [
            'ACTIVE',
            'ACKNOWLEDGED'
          ]
        }
      }).sort({
        startedAt: -1
      });

    response.json({
      success: true,
      incident:
        sanitizeIncident(
          incident
        )
    });
  } catch (error) {
    console.error(
      'Active emergency incident error:',
      error
    );

    response.status(500).json({
      success: false,
      message:
        'Active emergency incident could not be loaded.'
    });
  }
}

export async function startEmergencyIncident(
  request,
  response
) {
  try {
    if (!requireDatabase(response)) {
      return;
    }

    const existingIncident =
      await EmergencyIncident.findOne({
        user: request.user._id,

        status: {
          $in: [
            'ACTIVE',
            'ACKNOWLEDGED'
          ]
        }
      }).sort({
        startedAt: -1
      });

    if (existingIncident) {
      response.json({
        success: true,
        resumed: true,
        message:
          'Existing emergency incident resumed.',

        incident:
          sanitizeIncident(
            existingIncident
          )
      });

      return;
    }

    const contacts =
      await EmergencyContact.find({
        user: request.user._id,
        isActive: true
      }).sort({
        priority: 1,
        createdAt: 1
      });

    const featureUsage =
      await FeatureUsage.create({
        user: request.user._id,

        featureSlug:
          'emergency-alerts',

        featureName:
          'Emergency Alerts',

        status: 'STARTED',
        startedAt: new Date()
      });

    const incident =
      await EmergencyIncident.create({
        user: request.user._id,

        featureUsage:
          featureUsage._id,

        status: 'ACTIVE',
        level: 'OFF',
        startedAt: new Date(),

        contactAlerts:
          contacts.map(
            createContactSnapshot
          ),

        timeline: [
          {
            type:
              'INCIDENT_STARTED',

            level: 'OFF',

            message:
              'Emergency incident started.'
          }
        ]
      });

    response.status(201).json({
      success: true,
      resumed: false,
      message:
        'Emergency incident started successfully.',

      incident:
        sanitizeIncident(
          incident
        )
    });
  } catch (error) {
    console.error(
      'Emergency incident start error:',
      error
    );

    response.status(500).json({
      success: false,
      message:
        'Emergency incident could not be started.'
    });
  }
}

export async function triggerEmergencyLevel(
  request,
  response
) {
  try {
    if (!requireDatabase(response)) {
      return;
    }

    const level = cleanString(
      request.body.level,
      20
    ).toUpperCase();

    const note = cleanString(
      request.body.note,
      1000
    );

    if (!allowedLevels.has(level)) {
      response.status(400).json({
        success: false,
        message:
          'Level must be GOOD, MODERATE, HIGH, or OFF.'
      });

      return;
    }

    const incident =
      await EmergencyIncident.findOne({
        _id:
          request.params
            .incidentId,

        user:
          request.user._id,

        status: {
          $in: [
            'ACTIVE',
            'ACKNOWLEDGED'
          ]
        }
      });

    if (!incident) {
      response.status(404).json({
        success: false,
        message:
          'An active emergency incident was not found.'
      });

      return;
    }

    const location =
      normalizeLocation(
        request.body.location
      );

    if (
      location.permissionStatus !==
        'NOT_REQUESTED' ||
      location.latitude !== null
    ) {
      incident.location =
        location;
    }

    let hardwareResponse = null;
    let hardwareError = '';
    let acknowledged = false;

    try {
      hardwareResponse =
        await sendArduinoCommandAndWait(
          level,
          3000
        );

      acknowledged = true;
    } catch (error) {
      hardwareError =
        error.message;
    }

    incident.level = level;

    incident.note =
      note || incident.note;

    incident.hardware = {
      command: level,
      acknowledged,
      response:
        hardwareResponse,
      error: hardwareError,
      updatedAt: new Date()
    };

    incident.timeline.push({
      type: 'HARDWARE_ALERT',
      level,

      message: acknowledged
        ? `Arduino confirmed the ${level} command.`
        : `The ${level} command was recorded, but Arduino did not confirm it.`
    });

    if (
      location.permissionStatus ===
      'GRANTED'
    ) {
      incident.timeline.push({
        type:
          'LOCATION_CAPTURED',

        level,

        message:
          `Location captured with approximately ${
            location
              .accuracyMeters ??
            'unknown'
          } metres accuracy.`
      });
    } else if (
      level === 'HIGH' &&
      location.permissionStatus !==
        'NOT_REQUESTED'
    ) {
      incident.timeline.push({
        type:
          'LOCATION_UNAVAILABLE',

        level,

        message:
          `Location status: ${location.permissionStatus}.`
      });
    }

    await incident.save();

    response.json({
      success: true,

      message: acknowledged
        ? `Arduino confirmed the ${level} emergency level.`
        : `The ${level} event was saved, but Arduino did not confirm it.`,

      incident:
        sanitizeIncident(
          incident
        ),

      hardware: {
        command: level,
        acknowledged,
        response:
          hardwareResponse,
        error: hardwareError
      }
    });
  } catch (error) {
    console.error(
      'Emergency level trigger error:',
      error
    );

    response.status(500).json({
      success: false,
      message:
        'Emergency level could not be activated.'
    });
  }
}

export async function createEmergencyShareLink(
  request,
  response
) {
  try {
    if (!requireDatabase(response)) {
      return;
    }

    const incident =
      await EmergencyIncident.findOne({
        _id:
          request.params
            .incidentId,

        user:
          request.user._id,

        status: {
          $in: [
            'ACTIVE',
            'ACKNOWLEDGED'
          ]
        }
      });

    if (!incident) {
      response.status(404).json({
        success: false,
        message:
          'Active emergency incident was not found.'
      });

      return;
    }

    const contact =
      await EmergencyContact.findOne({
        _id:
          request.params
            .contactId,

        user:
          request.user._id,

        isActive: true
      });

    if (!contact) {
      response.status(404).json({
        success: false,
        message:
          'Active emergency contact was not found.'
      });

      return;
    }

    let contactAlert =
      incident.contactAlerts.find(
        alert =>
          String(alert.contact) ===
          String(contact._id)
      );

    if (!contactAlert) {
      incident.contactAlerts.push(
        createContactSnapshot(
          contact
        )
      );

      contactAlert =
        incident.contactAlerts[
          incident.contactAlerts
            .length - 1
        ];
    }

    const rawToken =
      crypto
        .randomBytes(32)
        .toString('hex');

    contactAlert.tokenHash =
      hashToken(rawToken);

    contactAlert.tokenExpiresAt =
      new Date(
        Date.now() +
          24 * 60 * 60 * 1000
      );

    contactAlert.status =
      'LINK_CREATED';

    incident.timeline.push({
      type:
        'CONTACT_LINK_CREATED',

      level: incident.level,

      message:
        `Emergency response link created for ${contact.name}.`
    });

    await incident.save();

    const frontendUrl =
      process.env.FRONTEND_URL ||
      'http://localhost:5173';

    const shareUrl =
      `${frontendUrl}/emergency-response/${rawToken}`;

    response.json({
      success: true,

      message:
        'Secure emergency response link created.',

      shareUrl,

      contact: {
        id: contact._id,
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        priority:
          contact.priority
      },

      incident:
        sanitizeIncident(
          incident
        )
    });
  } catch (error) {
    console.error(
      'Emergency share link error:',
      error
    );

    response.status(500).json({
      success: false,
      message:
        'Emergency response link could not be created.'
    });
  }
}

export async function getEmergencyIncident(
  request,
  response
) {
  try {
    if (!requireDatabase(response)) {
      return;
    }

    const incident =
      await EmergencyIncident.findOne({
        _id:
          request.params
            .incidentId,

        user:
          request.user._id
      });

    if (!incident) {
      response.status(404).json({
        success: false,
        message:
          'Emergency incident was not found.'
      });

      return;
    }

    response.json({
      success: true,

      incident:
        sanitizeIncident(
          incident
        )
    });
  } catch (error) {
    console.error(
      'Emergency incident read error:',
      error
    );

    response.status(500).json({
      success: false,
      message:
        'Emergency incident could not be loaded.'
    });
  }
}

export async function resolveEmergencyIncident(
  request,
  response
) {
  try {
    if (!requireDatabase(response)) {
      return;
    }

    const incident =
      await EmergencyIncident.findOne({
        _id:
          request.params
            .incidentId,

        user:
          request.user._id,

        status: {
          $in: [
            'ACTIVE',
            'ACKNOWLEDGED'
          ]
        }
      });

    if (!incident) {
      response.status(404).json({
        success: false,
        message:
          'Active emergency incident was not found.'
      });

      return;
    }

    let hardwareResponse = null;
    let hardwareError = '';
    let acknowledged = false;

    try {
      hardwareResponse =
        await sendArduinoCommandAndWait(
          'OFF',
          3000
        );

      acknowledged = true;
    } catch (error) {
      hardwareError =
        error.message;
    }

    const resolvedAt =
      new Date();

    const durationSeconds =
      Math.max(
        1,

        Math.round(
          (
            resolvedAt.getTime() -
            incident
              .startedAt
              .getTime()
          ) / 1000
        )
      );

    incident.status =
      'RESOLVED';

    incident.level =
      'OFF';

    incident.resolvedAt =
      resolvedAt;

    incident.hardware = {
      command: 'OFF',
      acknowledged,
      response:
        hardwareResponse,
      error: hardwareError,
      updatedAt: new Date()
    };

    incident.timeline.push({
      type:
        'INCIDENT_RESOLVED',

      level: 'OFF',

      message: acknowledged
        ? 'Incident resolved and Arduino confirmed OFF.'
        : 'Incident resolved, but Arduino did not confirm OFF.'
    });

    await incident.save();

    const highestLevel =
      getHighestTimelineLevel(
        incident.timeline
      );

    await FeatureUsage.findOneAndUpdate(
      {
        _id:
          incident.featureUsage,

        user:
          request.user._id
      },
      {
        status: 'COMPLETED',
        endedAt: resolvedAt,
        durationSeconds,

        result: {
          level: highestLevel,

          summary:
            `Emergency incident completed. Highest recorded level: ${highestLevel}.`,

          details:
            `${incident.contactAlerts.length} trusted contact record(s) were available during the incident.`,

          hardware: {
            command: 'OFF',
            acknowledged,
            response:
              hardwareResponse,
            error: hardwareError
          }
        }
      }
    );

    response.json({
      success: true,

      message: acknowledged
        ? 'Emergency incident resolved and hardware turned off.'
        : 'Emergency incident resolved, but hardware OFF was not confirmed.',

      incident:
        sanitizeIncident(
          incident
        )
    });
  } catch (error) {
    console.error(
      'Emergency incident resolution error:',
      error
    );

    response.status(500).json({
      success: false,
      message:
        'Emergency incident could not be resolved.'
    });
  }
}

export async function readPublicEmergencyResponse(
  request,
  response
) {
  try {
    if (!requireDatabase(response)) {
      return;
    }

    const tokenHash =
      hashToken(
        request.params.token
      );

    const incident =
      await EmergencyIncident.findOne({
        'contactAlerts.tokenHash':
          tokenHash
      }).populate(
        'user',
        'name'
      );

    if (!incident) {
      response.status(404).json({
        success: false,
        message:
          'Emergency response link is invalid.'
      });

      return;
    }

    const contactAlert =
      incident.contactAlerts.find(
        alert =>
          alert.tokenHash ===
          tokenHash
      );

    if (
      !contactAlert ||
      !contactAlert
        .tokenExpiresAt ||
      contactAlert
        .tokenExpiresAt
        .getTime() <
        Date.now()
    ) {
      response.status(410).json({
        success: false,
        message:
          'Emergency response link has expired.'
      });

      return;
    }

    if (
      contactAlert.status ===
      'LINK_CREATED'
    ) {
      contactAlert.status =
        'OPENED';

      contactAlert.openedAt =
        new Date();

      incident.timeline.push({
        type:
          'CONTACT_OPENED',

        level: incident.level,

        message:
          `${contactAlert.name} opened the emergency response link.`
      });

      await incident.save();
    }

    response.json({
      success: true,

      emergency: {
        userName:
          incident.user?.name ||
          'AEGIS user',

        level:
          incident.level,

        status:
          incident.status,

        startedAt:
          incident.startedAt,

        note:
          incident.note,

        hardwareConfirmed:
          incident.hardware
            .acknowledged,

        location:
          contactAlert
            .allowLocation
            ? incident.location
            : {
                permissionStatus:
                  'UNAVAILABLE',

                mapUrl: ''
              },

        contact: {
          name:
            contactAlert.name,

          relationship:
            contactAlert
              .relationship,

          response:
            contactAlert
              .response,

          status:
            contactAlert.status
        }
      }
    });
  } catch (error) {
    console.error(
      'Public emergency response error:',
      error
    );

    response.status(500).json({
      success: false,
      message:
        'Emergency response information could not be loaded.'
    });
  }
}

export async function acknowledgePublicEmergency(
  request,
  response
) {
  try {
    if (!requireDatabase(response)) {
      return;
    }

    const tokenHash =
      hashToken(
        request.params.token
      );

    const responseValue =
      cleanString(
        request.body.response,
        30
      ).toUpperCase();

    if (
      !allowedContactResponses
        .has(responseValue)
    ) {
      response.status(400).json({
        success: false,
        message:
          'Response must be RESPONDING or CANNOT_RESPOND.'
      });

      return;
    }

    const incident =
      await EmergencyIncident.findOne({
        'contactAlerts.tokenHash':
          tokenHash
      });

    if (!incident) {
      response.status(404).json({
        success: false,
        message:
          'Emergency response link is invalid.'
      });

      return;
    }

    const contactAlert =
      incident.contactAlerts.find(
        alert =>
          alert.tokenHash ===
          tokenHash
      );

    if (
      !contactAlert ||
      !contactAlert
        .tokenExpiresAt ||
      contactAlert
        .tokenExpiresAt
        .getTime() <
        Date.now()
    ) {
      response.status(410).json({
        success: false,
        message:
          'Emergency response link has expired.'
      });

      return;
    }

    contactAlert.response =
      responseValue;

    contactAlert
      .acknowledgedAt =
      new Date();

    contactAlert.status =
      responseValue ===
      'RESPONDING'
        ? 'ACKNOWLEDGED'
        : 'DECLINED';

    if (
      responseValue ===
      'RESPONDING'
    ) {
      incident.status =
        'ACKNOWLEDGED';
    }

    incident.timeline.push({
      type:
        'CONTACT_RESPONSE',

      level:
        incident.level,

      message:
        responseValue ===
        'RESPONDING'
          ? `${contactAlert.name} confirmed that they are responding.`
          : `${contactAlert.name} reported that they cannot respond.`
    });

    await incident.save();

    response.json({
      success: true,

      message:
        responseValue ===
        'RESPONDING'
          ? 'Your response has been recorded. Please contact the user directly.'
          : 'Your response has been recorded.'
    });
  } catch (error) {
    console.error(
      'Emergency acknowledgement error:',
      error
    );

    response.status(500).json({
      success: false,
      message:
        'Emergency response could not be recorded.'
    });
  }
}