import express from 'express';
import { loginUser, loginAdmin, registerUser, sendHelpEmailRequest } from '../controllers/authController.js';

const router = express.Router();

// Public routes for logging in/registering
router.post('/login/user', loginUser);
router.post('/login/admin', loginAdmin);
router.post('/register/user', registerUser);
router.post('/send-help-email', sendHelpEmailRequest);

export default router;
