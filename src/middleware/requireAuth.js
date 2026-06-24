import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import { User } from '../models/User.js';

import {
  getAuthCookieName
} from '../utils/authCookie.js';

export async function requireAuth(
  request,
  response,
  next
) {
  try {
    if (
      mongoose.connection.readyState !== 1
    ) {
      response.status(503).json({
        success: false,
        message:
          'Database connection is not available.'
      });

      return;
    }

    const cookieName =
      getAuthCookieName();

    const token =
      request.cookies?.[cookieName];

    if (!token) {
      response.status(401).json({
        success: false,
        message:
          'Authentication is required.'
      });

      return;
    }

    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(
      payload.userId
    );

    if (!user) {
      response.status(401).json({
        success: false,
        message:
          'Authentication session is invalid.'
      });

      return;
    }

    request.user = user;

    next();
  } catch (error) {
    response.status(401).json({
      success: false,
      message:
        'Authentication session has expired.'
    });
  }
}