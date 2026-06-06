import { Router } from 'express';
import FoodOrderController from './controller.js';
import { verifyJWT, authorizeRoles } from '../../middlewares/auth.js';

const router = Router();

// Secure all food order routes with JWT auth
router.use(verifyJWT);

// Traveler Endpoints
router.post('/', FoodOrderController.create);
router.get('/', FoodOrderController.listForUser);

// Host/Owner Endpoints
router.get('/host', authorizeRoles('ADMIN', 'HOTEL_OWNER'), FoodOrderController.listForHost);
router.patch('/:id/status', authorizeRoles('ADMIN', 'HOTEL_OWNER'), FoodOrderController.updateStatus);

export default router;
