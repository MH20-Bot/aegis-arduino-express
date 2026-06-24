import { Router } from 'express';

import {
  completeFeatureUsage,
  getFeatureHistory,
  startFeatureUsage
} from '../controllers/featureUsageController.js';

import {
  requireAuth
} from '../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.get(
  '/',
  getFeatureHistory
);

router.post(
  '/start',
  startFeatureUsage
);

router.patch(
  '/:usageId/complete',
  completeFeatureUsage
);

export default router;