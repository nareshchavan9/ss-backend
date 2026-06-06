import { Router } from 'express';
import BookingController from './controller.js';
import { validate } from '../../middlewares/validate.js';
import { createBookingSchema, updateBookingStatusSchema } from './schema.js';
import { verifyJWT, authorizeRoles } from '../../middlewares/auth.js';

const router = Router();

// Secure all booking routes
router.use(verifyJWT);

// Create a booking (Traveler/User role)
router.post(
  '/',
  validate(createBookingSchema),
  BookingController.create
);

// Get bookings for host's hotels
router.get(
  '/host',
  authorizeRoles('HOTEL_OWNER', 'ADMIN'),
  BookingController.listHostBookings
);

// Get bookings for logged-in traveler
router.get(
  '/traveler',
  BookingController.listTravelerBookings
);

// Update booking status (Approve/Cancel)
router.patch(
  '/:id/status',
  validate(updateBookingStatusSchema),
  BookingController.updateStatus
);

export default router;
