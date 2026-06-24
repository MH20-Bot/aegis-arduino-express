import {
  Router
} from 'express';

import {
  createEmergencyContact,
  createEmergencyShareLink,
  deleteEmergencyContact,
  getActiveEmergencyIncident,
  getEmergencyIncident,
  listEmergencyContacts,
  readEmergencyHardwareStatus,
  resolveEmergencyIncident,
  startEmergencyIncident,
  triggerEmergencyLevel,
  updateEmergencyContact
} from '../controllers/emergencyNetworkController.js';

import {
  requireAuth
} from '../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.get(
  '/contacts',
  listEmergencyContacts
);

router.post(
  '/contacts',
  createEmergencyContact
);

router.patch(
  '/contacts/:contactId',
  updateEmergencyContact
);

router.delete(
  '/contacts/:contactId',
  deleteEmergencyContact
);

router.get(
  '/hardware-status',
  readEmergencyHardwareStatus
);

router.get(
  '/incidents/active',
  getActiveEmergencyIncident
);

router.post(
  '/incidents/start',
  startEmergencyIncident
);

router.get(
  '/incidents/:incidentId',
  getEmergencyIncident
);

router.post(
  '/incidents/:incidentId/trigger',
  triggerEmergencyLevel
);

router.post(
  '/incidents/:incidentId/share/:contactId',
  createEmergencyShareLink
);

router.post(
  '/incidents/:incidentId/resolve',
  resolveEmergencyIncident
);

export default router;