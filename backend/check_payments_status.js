import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkPayments() {
    const { data: payments, error } = await supabase
        .from('payments')
        .select('*, users!user_id(username, gst_id, district)');

    if (error) {
        console.error('Error fetching payments:', error);
        return;
    }

    console.log('Total Payments found:', payments.length);
    payments.forEach(p => {
        console.log(`User: ${p.users?.username}, GST: ${p.users?.gst_id}, District: ${p.users?.district}, Amount: ${p.amount}, Status: ${p.status}`);
    });

    const successful = payments.filter(p => p.status === 'success' || p.status === 'captured');
    console.log('Successful Payments count:', successful.length);
    const total = successful.reduce((sum, p) => sum + Number(p.amount), 0);
    console.log('Grand Total Collected:', total);
}

checkPayments();
