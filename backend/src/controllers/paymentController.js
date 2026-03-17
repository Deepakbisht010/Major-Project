import Razorpay from 'razorpay';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createOrder = async (req, res) => {
    try {
        const { amount, currency, receipt, notes } = req.body;

        const options = {
            amount: amount * 100, // amount in the smallest currency unit (paise for INR)
            currency: currency || 'INR',
            receipt: receipt || `receipt_${Date.now()}`,
            notes: notes || {},
        };

        const order = await razorpay.orders.create(options);

        // Initial payment record in Supabase
        const { error } = await supabase.from('payments').insert({
            user_id: req.body.userId,
            razorpay_order_id: order.id,
            amount: amount,
            currency: options.currency,
            status: 'pending',
            email: req.body.email,
            name: req.body.name
        });

        if (error) {
            console.error('Supabase Error:', error.message, error.details);
            return res.status(500).json({
                message: 'Failed to record payment initialization',
                error: error.message
            });
        }

        res.status(200).json(order);
    } catch (error) {
        console.error('Razorpay Order Error:', error);
        res.status(500).json({
            message: 'Internal Server Error',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};


export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            // Update payment status in Supabase
            const { error } = await supabase
                .from('payments')
                .update({
                    razorpay_payment_id,
                    razorpay_signature,
                    status: 'captured',
                    updated_at: new Date()
                })
                .eq('razorpay_order_id', razorpay_order_id);

            if (error) {
                console.error('Supabase update error:', error);
                return res.status(500).json({ message: 'Failed to update payment status' });
            }

            res.status(200).json({ message: 'Payment verified successfully', success: true });
        } else {
            res.status(400).json({ message: 'Invalid signature', success: false });
        }
    } catch (error) {
        console.error('Verification Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const handleWebhook = async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    const body = JSON.stringify(req.body);

    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');

    if (expectedSignature === signature) {
        const event = req.body.event;
        const payload = req.body.payload.payment.entity;

        if (event === 'payment.captured') {
            // Update database for captured payment via webhook as backup
            await supabase
                .from('payments')
                .update({
                    razorpay_payment_id: payload.id,
                    status: 'captured',
                    updated_at: new Date()
                })
                .eq('razorpay_order_id', payload.order_id);

            // Also update the taxes table if we have enough info
            // This part would need logic to link the payment to a specific tax record
        }

        res.status(200).json({ status: 'ok' });
    } else {
        res.status(400).json({ status: 'invalid signature' });
    }
};
