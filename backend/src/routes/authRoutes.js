import express from 'express';
import { loginUser, loginAdmin, registerUser } from '../controllers/authController.js';

const router = express.Router();

// Public routes for logging in/registering
router.post('/register/user', registerUser);
router.post('/login/user', loginUser);
router.post('/login/admin', loginAdmin);

export default router;
