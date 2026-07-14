import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import * as authController from '../../controllers/auth.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { 
  registerValidator, 
  loginValidator, 
  forgotPasswordValidator, 
  resetPasswordValidator 
} from '../../validators';

const router = Router();

router.post('/register', registerValidator, validate, asyncHandler(authController.register));
router.post('/login', loginValidator, validate, asyncHandler(authController.login));
router.post('/refresh', asyncHandler(authController.refresh));
router.post('/logout', asyncHandler(authController.logout));
router.get('/verify-email', asyncHandler(authController.verifyEmail));
router.post('/forgot-password', forgotPasswordValidator, validate, asyncHandler(authController.forgotPassword));
router.post('/reset-password', resetPasswordValidator, validate, asyncHandler(authController.resetPassword));

// Get current user (protected)
router.get('/me', authenticate, (req, res) => {
  res.json({ success: true, data: req.user });
});

export default router;
