import express from 'express';
import { loginUser, loginAdmin, registerUser, sendHelpEmailRequest, sendOtpByMobile, resetPasswordByMobile } from '../controllers/authController.js';

const router = express.Router();

// Public routes for logging in/registering
router.post('/login/user', loginUser);
router.post('/login/admin', loginAdmin);
router.post('/register/user', registerUser);
router.post('/send-help-email', sendHelpEmailRequest);

// Forgot Password routes
router.post('/forgot-password/send-otp', sendOtpByMobile);
router.post('/forgot-password/reset', resetPasswordByMobile);

export default router;
