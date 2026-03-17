import express from 'express';
import { getTaxpayerProfile, getTaxpayerTaxes } from '../controllers/taxpayerController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// All taxpayer routes require authentication
router.use(requireAuth);

router.get('/profile', getTaxpayerProfile);
router.get('/taxes', getTaxpayerTaxes);

export default router;
