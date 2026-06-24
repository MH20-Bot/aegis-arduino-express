import {
  Router
} from 'express';

import {
  completeARSession,
  getARHistory,
  startARSession
} from '../controllers/arAssistantController.js';

import {
  requireAuth
} from '../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.post(
  '/start',
  startARSession
);

router.patch(
  '/:sessionId/complete',
  completeARSession
);

router.get(
  '/history',
  getARHistory
);

export default router;