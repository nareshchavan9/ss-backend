import { Router } from 'express';
import WishlistController from './controller.js';
import { validate } from '../../middlewares/validate.js';
import { toggleWishlistSchema } from './schema.js';
import { verifyJWT } from '../../middlewares/auth.js';

const router = Router();

// Secure all wishlist routes
router.use(verifyJWT);

// Toggle hotel in wishlist (POST /api/v1/wishlist)
router.post(
  '/',
  validate(toggleWishlistSchema),
  WishlistController.toggle
);

// Get list of wishlist items (GET /api/v1/wishlist)
router.get(
  '/',
  WishlistController.list
);

export default router;
