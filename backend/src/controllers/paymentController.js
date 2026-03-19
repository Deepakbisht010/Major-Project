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

import { getTaxAmount } from '../utils/pricing.js';

export const createOrder = async (req, res) => {
    try {
        const { currency, receipt, notes } = req.body;
        const shopId = notes?.shopId;

        if (!shopId) {
            return res.status(400).json({ message: 'Shop ID is required in notes.' });
        }

        // 1. Fetch user business type
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('business_type')
            .eq('id', shopId)
            .single();

        if (userError || !user) {
            return res.status(404).json({ message: 'User business type not found.' });
        }

        // 2. Fetch dynamic amount (Point 4)
        const amount = await getTaxAmount(user.business_type);

        // --- ENFORCE SMART PAYMENT LOGIC ---
        // 2. Only allow payment for current month (or past months)
        if (notes && notes.month) {
            const now = new Date();
            const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

            if (notes.month > currentMonthStr) {
                return res.status(400).json({ message: 'Access Denied: You cannot pay for future months.' });
            }

            // 3. Prevent duplicate payment for same month
            const { data: existingTax } = await supabase
                .from('monthly_taxes')
                .select('status')
                .eq('shop_id', shopId)
                .eq('month', notes.month)
                .maybeSingle();

            if (existingTax && existingTax.status === 'paid') {
                return res.status(400).json({ message: 'This month is already paid.' });
            }
        }
        // ------------------------------------

        const options = {
            amount: amount * 100, // Dynamic amount in paise (Point 5)
            currency: currency || 'INR',
            receipt: receipt || `receipt_${Date.now()}`,
            notes: { ...notes, amount }, // Point 6
        };

        const order = await razorpay.orders.create(options);

        // Initial payment record in Supabase
        const insertData = {
            user_id: req.body.userId,
            razorpay_order_id: order.id,
            amount: amount, // Dynamic amount stored (Point 6 & 7)
            currency: options.currency,
            status: 'pending',
            email: req.body.email,
            name: req.body.name,
            receipt_number: options.receipt,
            transaction_id: order.id,
            month: notes?.month,
            shop_id: shopId
        };

        const { error } = await supabase.from('payments').insert(insertData);

        if (error) {
            console.error('Supabase Error:', error.message);
            return res.status(500).json({ message: 'Failed to initialize payment record' });
        }

        res.status(200).json(order);
    } catch (error) {
        console.error('Razorpay Order Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, create_tax_record } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            // Update payment status in Supabase
            const { data: updateData, error } = await supabase
                .from('payments')
                .update({
                    razorpay_payment_id,
                    razorpay_signature,
                    transaction_id: razorpay_payment_id,
                    status: 'success',
                    updated_at: new Date()
                })
                .eq('razorpay_order_id', razorpay_order_id)
                .select()
                .maybeSingle();

            if (error) {
                console.error('Supabase update error:', error);
                return res.status(500).json({ message: 'Failed to update payment status' });
            }

            // --- SMART TAX RECORD UPSERT (Requested in Step 1-4) ---
            if (updateData && updateData.shop_id && updateData.month) {
                const taxInsert = {
                    shop_id: updateData.shop_id,
                    month: updateData.month,
                    amount: updateData.amount || 1,
                    status: 'paid',
                    updated_at: new Date()
                };

                const { error: upsertError } = await supabase
                    .from('monthly_taxes')
                    .upsert(taxInsert, { onConflict: 'shop_id, month' });

                if (upsertError) {
                    console.error('Error upserting tax record:', upsertError.message);
                }
            }
            // ----------------------------------------------------

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
            const { data: webhookPayment } = await supabase
                .from('payments')
                .update({
                    razorpay_payment_id: payload.id,
                    status: 'success',
                    updated_at: new Date()
                })
                .eq('razorpay_order_id', payload.order_id)
                .select()
                .single();

            // Also update the taxes table if we have enough info
            if (webhookPayment && webhookPayment.tax_id) {
                await supabase
                    .from('taxes')
                    .update({ status: 'paid', paid_date: new Date() })
                    .eq('id', webhookPayment.tax_id);
            }
        }

        res.status(200).json({ status: 'ok' });
    } else {
        res.status(400).json({ status: 'invalid signature' });
    }
};

export const getPaymentHistory = async (req, res) => {
    try {
        const authId = req.user.id;

        // 1. Get the integer user_id from users table using the Auth UUID
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', authId)
            .single();

        if (profileError || !profile) {
            console.error('Profile not found for auth_id:', authId);
            return res.status(404).json({ success: false, error: 'User profile not found' });
        }

        const userId = profile.id;

        // 2. Fetch payments using the integer userId
        const { data: history, error } = await supabase
            .from('payments')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'success')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.status(200).json({ success: true, history });
    } catch (error) {
        console.error('getPaymentHistory error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch payment history' });
    }
};
