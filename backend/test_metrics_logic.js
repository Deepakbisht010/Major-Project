import { supabase } from './src/config/supabase.js';
import dotenv from 'dotenv';
dotenv.config();

const testMetrics = async (adminDistrict) => {
    try {
        console.log(`\n--- Testing for Admin District: ${adminDistrict} ---`);
        const mapDistrict = (d) => {
            if (!d) return d;
            const lower = d.toLowerCase();
            if (lower === 'udhamsinghnagar') return 'udhamsingh';
            return lower;
        };
        const targetDistrict = mapDistrict(adminDistrict);
        const isFiltered = targetDistrict && targetDistrict !== 'all' && targetDistrict !== 'admin';

        console.log('Target District:', targetDistrict, '| Is Filtered:', isFiltered);

        let userQuery = supabase.from('users').select(`
            *,
            taxes!user_id ( status, amount ),
            monthly_taxes!shop_id ( status, amount )
        `);

        if (isFiltered) userQuery = userQuery.eq('district', targetDistrict);
        const { data: users, error: userError } = await userQuery;
        if (userError) throw userError;
        console.log('Users found:', users.length);

        let paymentQuery = supabase.from('payments').select(`
            amount, status, created_at, user_id, 
            users!user_id!inner(district, username, gst_id, business_type, block)
        `);

        if (isFiltered) {
            paymentQuery = paymentQuery.eq('users.district', targetDistrict);
        }

        const { data: payments, error: paymentError } = await paymentQuery;
        if (paymentError) throw paymentError;

        const successfulPayments = (payments || []).filter(p => p.status === 'success' || p.status === 'captured');
        const totalTaxesCollected = successfulPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;

        console.log(`Successful Payments: ${successfulPayments.length}`);
        console.log(`Total Collected: ${totalTaxesCollected}`);
        if (successfulPayments.length > 0) {
            console.log('Sample Payment User District:', successfulPayments[0].users?.district);
        }
    } catch (e) {
        console.error('Test Failed:', e);
    }
};

const run = async () => {
    await testMetrics('all');
    await testMetrics('udhamsingh');
    await testMetrics('almora');
};

run();
