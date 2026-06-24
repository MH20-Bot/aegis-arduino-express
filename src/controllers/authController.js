import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

import { User } from '../models/User.js';

import {
  clearAuthCookie,
  createAuthToken,
  setAuthCookie
} from '../utils/authCookie.js';

function databaseIsConnected() {
  return mongoose.connection.readyState === 1;
}

function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt
  };
}

export async function registerUser(
  request,
  response
) {
  try {
    if (!databaseIsConnected()) {
      response.status(503).json({
        success: false,
        message:
          'Database connection is not available.'
      });

      return;
    }

    const name = String(
      request.body.name || ''
    ).trim();

    const email = normalizeEmail(
      request.body.email
    );

    const password = String(
      request.body.password || ''
    );

    if (name.length < 2) {
      response.status(400).json({
        success: false,
        message:
          'Name must contain at least 2 characters.'
      });

      return;
    }

    if (
      !email ||
      !email.includes('@')
    ) {
      response.status(400).json({
        success: false,
        message:
          'A valid email address is required.'
      });

      return;
    }

    if (password.length < 8) {
      response.status(400).json({
        success: false,
        message:
          'Password must contain at least 8 characters.'
      });

      return;
    }

    const existingUser =
      await User.findOne({
        email
      });

    if (existingUser) {
      response.status(409).json({
        success: false,
        message:
          'An account already exists with this email address.'
      });

      return;
    }

    const passwordHash =
      await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      passwordHash,
      lastLoginAt: new Date()
    });

    const token = createAuthToken(
      user._id.toString()
    );

    setAuthCookie(response, token);

    response.status(201).json({
      success: true,
      message:
        'Registration completed successfully.',
      user: publicUser(user)
    });
  } catch (error) {
    console.error(
      'Registration error:',
      error.message
    );

    if (error.code === 11000) {
      response.status(409).json({
        success: false,
        message:
          'An account already exists with this email address.'
      });

      return;
    }

    response.status(500).json({
      success: false,
      message:
        'Registration could not be completed.'
    });
  }
}

export async function loginUser(
  request,
  response
) {
  try {
    if (!databaseIsConnected()) {
      response.status(503).json({
        success: false,
        message:
          'Database connection is not available.'
      });

      return;
    }

    const email = normalizeEmail(
      request.body.email
    );

    const password = String(
      request.body.password || ''
    );

    const user = await User.findOne({
      email
    }).select('+passwordHash');

    if (!user) {
      response.status(401).json({
        success: false,
        message:
          'Email or password is incorrect.'
      });

      return;
    }

    const passwordMatches =
      await bcrypt.compare(
        password,
        user.passwordHash
      );

    if (!passwordMatches) {
      response.status(401).json({
        success: false,
        message:
          'Email or password is incorrect.'
      });

      return;
    }

    user.lastLoginAt = new Date();

    await user.save();

    const token = createAuthToken(
      user._id.toString()
    );

    setAuthCookie(response, token);

    response.json({
      success: true,
      message: 'Login successful.',
      user: publicUser(user)
    });
  } catch (error) {
    console.error(
      'Login error:',
      error.message
    );

    response.status(500).json({
      success: false,
      message:
        'Login could not be completed.'
    });
  }
}

export function logoutUser(
  request,
  response
) {
  clearAuthCookie(response);

  response.json({
    success: true,
    message: 'Logout successful.'
  });
}

export function getCurrentUser(
  request,
  response
) {
  response.json({
    success: true,
    user: publicUser(request.user)
  });
}