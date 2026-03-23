import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTotalStatus() {
    const { data: users } = await supabase.from('users').select('id, username, district').eq('username', 'Ajay');
    if (!users?.length) {
        console.log('User Ajay not found');
        return;
    }
    const ajay = users[0];
    console.log('User Ajay ID:', ajay.id, 'District:', ajay.district);

    const { data: payments } = await supabase.from('payments').select('*').eq('user_id', ajay.id);
    console.log('Ajay Payments:', payments?.map(p => ({ amount: p.amount, status: p.status })));

    const { data: monthlyTaxes } = await supabase.from('monthly_taxes').select('*').eq('shop_id', ajay.id);
    console.log('Ajay Monthly Taxes:', monthlyTaxes?.map(t => ({ month: t.month, status: t.status })));

    // Global check for any paid records in monthly_taxes
    const { data: allPaid } = await supabase.from('monthly_taxes').select('status').eq('status', 'paid');
    console.log('Total Paid records in monthly_taxes:', allPaid?.length || 0);

    // Global check for any success records in payments
    const { data: allSuccess } = await supabase.from('payments').select('amount, status').in('status', ['success', 'captured']);
    console.log('Total successful payments in DB:', allSuccess?.length || 0);
    console.log('Total Collected in DB:', allSuccess?.reduce((sum, p) => sum + Number(p.amount), 0) || 0);
}

checkTotalStatus();
