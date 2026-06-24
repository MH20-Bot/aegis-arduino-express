import { Router } from 'express';

import {
  finishEmergencySession,
  getEmergencyEvents,
  readEmergencyHardwareStatus,
  startEmergencySession,
  triggerEmergencyAlert
} from '../controllers/emergencyAlertController.js';

import {
  requireAuth
} from '../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.get(
  '/hardware-status',
  readEmergencyHardwareStatus
);

router.post(
  '/start',
  startEmergencySession
);

router.post(
  '/:usageId/trigger',
  triggerEmergencyAlert
);

router.post(
  '/:usageId/finish',
  finishEmergencySession
);

router.get(
  '/:usageId/events',
  getEmergencyEvents
);

export default router;