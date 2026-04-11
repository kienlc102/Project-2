import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as authController from '../controllers/auth.controller';

const router = Router();

// Auth routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/logout', authMiddleware, authController.logout);

// Profile routes
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, authController.updateProfile);
router.delete('/profile', authMiddleware, authController.deleteAccount);

// Password
router.put('/password', authMiddleware, authController.updatePassword);

// Email verification
router.post('/email/send-code', authController.sendVerificationCode);
router.post('/email/verify', authController.verifyEmailCode);

export default router;
