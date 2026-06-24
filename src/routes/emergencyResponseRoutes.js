import {
  Router
} from 'express';

import {
  acknowledgePublicEmergency,
  readPublicEmergencyResponse
} from '../controllers/emergencyNetworkController.js';

const router = Router();

router.get(
  '/:token',
  readPublicEmergencyResponse
);

router.post(
  '/:token/acknowledge',
  acknowledgePublicEmergency
);

export default router;