import { Router } from 'express';
import AuthController from './controller.js';
import { validate } from '../../middlewares/validate.js';
import { registerSchema, loginSchema } from './schema.js';
import { verifyJWT, authorizeRoles } from '../../middlewares/auth.js';
import upload from '../../middlewares/upload.js';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/refresh-token', AuthController.refreshAccessToken);

// Protected routes
router.post('/logout', verifyJWT, AuthController.logout);
router.get('/me', verifyJWT, AuthController.getMe);
router.put('/profile', verifyJWT, AuthController.updateProfile);
router.post('/profile/avatar', verifyJWT, upload.single('avatar'), AuthController.updateAvatar);

// Admin routes
router.get('/users', verifyJWT, authorizeRoles('ADMIN'), AuthController.getAllUsers);
router.post('/users', verifyJWT, authorizeRoles('ADMIN'), AuthController.createUser);
router.put('/users/:id/role', verifyJWT, authorizeRoles('ADMIN'), AuthController.updateUserRole);
router.put('/users/:id/status', verifyJWT, authorizeRoles('ADMIN'), AuthController.updateUserStatus);
router.post('/broadcasts', verifyJWT, authorizeRoles('ADMIN'), AuthController.createBroadcast);
router.put('/broadcasts/:id', verifyJWT, authorizeRoles('ADMIN'), AuthController.updateBroadcast);
router.delete('/broadcasts/:id', verifyJWT, authorizeRoles('ADMIN'), AuthController.deleteBroadcast);
router.get('/system-config', verifyJWT, authorizeRoles('ADMIN'), AuthController.getSystemConfig);
router.put('/system-config', verifyJWT, authorizeRoles('ADMIN'), AuthController.updateSystemConfig);

// User-facing broadcasts
router.get('/broadcasts', verifyJWT, AuthController.getBroadcasts);

export default router;
