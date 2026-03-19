import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
    const { data: users } = await supabase.from('users').select('id, username').limit(1);
    const shopId = users[0].id;
    const inserts = [{
        shop_id: shopId,
        month: '2026-12',
        amount: 1,
        status: 'pending'
    }];

    console.log('Testing upsert with onConflict: "shop_id,month" (no space)');
    const { data, error } = await supabase
        .from('monthly_taxes')
        .upsert(inserts, { onConflict: 'shop_id,month' })
        .select();

    if (error) {
        console.error('ERROR:', JSON.stringify(error, null, 2));
    } else {
        console.log('SUCCESS:', data.length);
    }
}

test();
