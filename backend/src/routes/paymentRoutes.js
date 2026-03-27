import express from 'express';
import { createOrder, verifyPayment, handleWebhook, getPaymentHistory } from '../controllers/paymentController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create-order', requireAuth, createOrder);
router.post('/verify-payment', requireAuth, verifyPayment);
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// New route for fetching payment history
router.get('/history', requireAuth, getPaymentHistory);

export default router;
