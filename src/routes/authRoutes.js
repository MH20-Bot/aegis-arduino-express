import { Router } from 'express';

import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser
} from '../controllers/authController.js';

import {
  requireAuth
} from '../middleware/requireAuth.js';

const router = Router();

router.post(
  '/register',
  registerUser
);

router.post(
  '/login',
  loginUser
);

router.post(
  '/logout',
  logoutUser
);

router.get(
  '/me',
  requireAuth,
  getCurrentUser
);

export default router;