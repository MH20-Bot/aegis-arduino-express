
import { Router } from 'express';

import {
  analyzePosture,
  getPostureHistory
} from '../controllers/postureAnalysisController.js';

import {
  requireAuth
} from '../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.post(
  '/analyze',
  analyzePosture
);

router.get(
  '/history',
  getPostureHistory
);

export default router;
