import {
  Router
} from 'express';

import {
  buildDigitalTwinProfile,
  createDigitalTwinSnapshot,
  getDigitalTwinHistory,
  getDigitalTwinProfile,
  simulateDigitalTwinScenario
} from '../controllers/digitalTwinController.js';

import {
  requireAuth
} from '../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.get(
  '/profile',
  getDigitalTwinProfile
);

router.post(
  '/build',
  buildDigitalTwinProfile
);

router.post(
  '/snapshot',
  createDigitalTwinSnapshot
);

router.post(
  '/simulate',
  simulateDigitalTwinScenario
);

router.get(
  '/history',
  getDigitalTwinHistory
);

export default router;