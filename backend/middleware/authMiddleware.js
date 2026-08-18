import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getFallbackState } from '../config/db.js';
import { memoryStore } from '../store/memoryStore.js';

const getJwtSecret = () => {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('CRITICAL SECURITY ERROR: JWT_SECRET environment variable is required in production mode!');
  }
  return 'shortx_dev_jwt_secret_key_only';
};

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, getJwtSecret());

      if (getFallbackState()) {
        const user = await memoryStore.findUserById(decoded.id);
        if (!user) {
          return res.status(401).json({ success: false, error: 'User not found' });
        }
        req.user = { id: user._id, name: user.name, email: user.email };
      } else {
        req.user = await User.findById(decoded.id).select('-password');
        if (!req.user) {
          return res.status(401).json({ success: false, error: 'User not found' });
        }
      }

      return next();
    } catch (error) {
      console.error('[Auth Middleware Error]', error.message);
      return res.status(401).json({ success: false, error: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorized, no token provided' });
  }
};

export const optionalAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, getJwtSecret());

      if (getFallbackState()) {
        const user = await memoryStore.findUserById(decoded.id);
        if (user) {
          req.user = { id: user._id, name: user.name, email: user.email };
        }
      } else {
        const user = await User.findById(decoded.id).select('-password');
        if (user) {
          req.user = user;
        }
      }
    } catch (error) {
      // Ignore token errors for optional auth (treat as guest)
      console.log('[OptionalAuth Note] Invalid token provided for guest request');
    }
  }

  next();
};

export const generateToken = (id) => {
  return jwt.sign({ id }, getJwtSecret(), { expiresIn: '30d' });
};
