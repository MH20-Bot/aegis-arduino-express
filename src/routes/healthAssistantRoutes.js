import {
  Router
} from 'express';

import {
  analyzeHealthAssistant,
  getHealthAssistantHistory
} from '../controllers/healthAssistantController.js';

import {
  requireAuth
} from '../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.post(
  '/analyze',
  analyzeHealthAssistant
);

router.get(
  '/history',
  getHealthAssistantHistory
);

export default router;