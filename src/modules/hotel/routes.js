import { Router } from 'express';
import HotelController from './controller.js';
import { validate } from '../../middlewares/validate.js';
import { createHotelSchema, updateHotelSchema, searchHotelQuerySchema } from './schema.js';
import { verifyJWT, authorizeRoles } from '../../middlewares/auth.js';
import upload from '../../middlewares/upload.js';
import roomRouter from '../room/routes.js';

const router = Router();

// Nested Room Routes
router.use('/:hotelId/rooms', roomRouter);

// Public Routes
router.get('/', validate(searchHotelQuerySchema), HotelController.list);
router.get('/:id', HotelController.getDetail);

// Protected Routes
router.post(
  '/',
  verifyJWT,
  authorizeRoles('ADMIN', 'HOTEL_OWNER'),
  validate(createHotelSchema),
  HotelController.create
);

router.patch(
  '/:id',
  verifyJWT,
  authorizeRoles('ADMIN', 'HOTEL_OWNER'),
  validate(updateHotelSchema),
  HotelController.update
);

router.delete(
  '/:id',
  verifyJWT,
  authorizeRoles('ADMIN'),
  HotelController.delete
);

router.post(
  '/:id/images',
  verifyJWT,
  authorizeRoles('ADMIN', 'HOTEL_OWNER'),
  upload.array('images', 10),
  HotelController.uploadImages
);

router.delete(
  '/:id/images/:imageId',
  verifyJWT,
  authorizeRoles('ADMIN', 'HOTEL_OWNER'),
  HotelController.deleteImage
);

export default router;
