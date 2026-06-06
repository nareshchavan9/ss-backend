import { Router } from 'express';
import ReviewController from './controller.js';
import { validate } from '../../middlewares/validate.js';
import { createReviewSchema, replyReviewSchema } from './schema.js';
import { verifyJWT, authorizeRoles } from '../../middlewares/auth.js';

const router = Router();

// Secure all review routes
router.use(verifyJWT);

// Create a review
router.post(
  '/',
  validate(createReviewSchema),
  ReviewController.create
);

// Get reviews for host's hotels
router.get(
  '/host',
  authorizeRoles('HOTEL_OWNER', 'ADMIN'),
  ReviewController.listHostReviews
);

// Submit host response to a review
router.patch(
  '/:id/reply',
  authorizeRoles('HOTEL_OWNER', 'ADMIN'),
  validate(replyReviewSchema),
  ReviewController.reply
);

export default router;
