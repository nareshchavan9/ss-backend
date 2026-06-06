import { Router } from 'express';
import RoomController from './controller.js';
import { validate } from '../../middlewares/validate.js';
import { createRoomSchema, updateRoomSchema, checkAvailabilityQuerySchema } from './schema.js';
import { verifyJWT, authorizeRoles } from '../../middlewares/auth.js';
import upload from '../../middlewares/upload.js';

// Setup router with mergeParams to inherit hotelId from parent router if nested
const router = Router({ mergeParams: true });

// 1. Availability route (MUST be placed before /:roomId parameter to prevent conflicts)
router.get('/available', validate(checkAvailabilityQuerySchema), RoomController.checkAvailability);

// 2. Base nested routes: GET /api/v1/hotels/:hotelId/rooms and POST /api/v1/hotels/:hotelId/rooms
router.post(
  '/',
  verifyJWT,
  authorizeRoles('ADMIN', 'HOTEL_OWNER'),
  validate(createRoomSchema),
  RoomController.create
);

router.get('/', RoomController.list);

// 3. Room specific nested routes: /api/v1/hotels/:hotelId/rooms/:roomId
router.get('/:roomId', RoomController.getDetail);

router.patch(
  '/:roomId',
  verifyJWT,
  authorizeRoles('ADMIN', 'HOTEL_OWNER'),
  validate(updateRoomSchema),
  RoomController.update
);

router.delete(
  '/:roomId',
  verifyJWT,
  authorizeRoles('ADMIN'),
  RoomController.delete
);

router.post(
  '/:roomId/images',
  verifyJWT,
  authorizeRoles('ADMIN', 'HOTEL_OWNER'),
  upload.array('images', 8),
  RoomController.uploadImages
);

export default router;
