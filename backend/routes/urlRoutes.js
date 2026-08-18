import express from 'express';
import {
  createShortUrl,
  getAllUrls,
  getUserUrls,
  getUrlStats,
  deleteUrl,
  updateUrl,
  checkAliasAvailability
} from '../controllers/urlController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public / Optional Auth routes
router.get('/urls/check-alias/:alias', checkAliasAvailability);
router.post('/urls', optionalAuth, createShortUrl);
router.get('/urls', getAllUrls);

// User-protected dashboard routes
router.get('/urls/user', protect, getUserUrls);
router.get('/urls/stats/:shortCode', getUrlStats);

// Update / Delete routes
router.patch('/urls/:id', optionalAuth, updateUrl);
router.delete('/urls/:id', optionalAuth, deleteUrl);

export default router;
