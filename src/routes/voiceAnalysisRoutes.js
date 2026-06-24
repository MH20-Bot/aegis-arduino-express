import { Router } from 'express';

import {
  analyzeVoice
} from '../controllers/voiceAnalysisController.js';

import {
  requireAuth
} from '../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.post(
  '/analyze',
  analyzeVoice
);

export default router;