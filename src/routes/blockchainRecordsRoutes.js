import {
  Router
} from 'express';

import {
  createBlockchainRecord,
  listBlockchainRecords,
  verifyBlockchainRecords
} from '../controllers/blockchainRecordsController.js';

import {
  requireAuth
} from '../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.get(
  '/',
  listBlockchainRecords
);

router.post(
  '/create',
  createBlockchainRecord
);

router.get(
  '/verify',
  verifyBlockchainRecords
);

export default router;