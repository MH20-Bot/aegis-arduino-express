import {
  Router
} from 'express';

import {
  analyzeEnvironment,
  getEnvironmentalHistory
} from '../controllers/environmentalMonitorController.js';

import {
  requireAuth
} from '../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.post(
  '/analyze',
  analyzeEnvironment
);

router.get(
  '/history',
  getEnvironmentalHistory
);

export default router;