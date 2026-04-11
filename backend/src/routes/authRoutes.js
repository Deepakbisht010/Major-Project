import express from 'express';
import { loginUser, loginAdmin, registerUser, sendHelpEmailRequest, sendOtpByMobile, resetPasswordByMobile } from '../controllers/authController.js';

const router = express.Router();

// Public routes for logging in/registering


// Forgot Password routes
router.post('/forgot-password/send-otp', sendOtpByMobile);
router.post('/forgot-password/reset', resetPasswordByMobile);

export default router;
