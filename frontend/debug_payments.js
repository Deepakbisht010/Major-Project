import { supabase } from './backend/src/config/supabase.js';
import fs from 'fs';

async function checkPayments() {
    const { data, error } = await supabase.from('payments').select('*, users!user_id(username, gst_id)').limit(10);
    if (error) {
        console.error('Error:', error);
        return;
    }
    fs.writeFileSync('payment_debug.json', JSON.stringify(data, null, 2));
    console.log('Written to payment_debug.json');
}

checkPayments();
