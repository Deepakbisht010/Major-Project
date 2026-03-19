import express from 'express';
import { getTaxpayerProfile, getTaxpayerTaxes, getMonthlyTaxes, generateMonthlyTaxes } from '../controllers/taxpayerController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// All taxpayer routes require authentication
router.use(requireAuth);

router.get('/profile', getTaxpayerProfile);
router.get('/taxes', getTaxpayerTaxes);
router.get('/monthly-taxes', getMonthlyTaxes);
router.post('/generate-monthly-taxes', generateMonthlyTaxes);

export default router;
