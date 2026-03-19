import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
    // Let's first fetch a real user ID
    const { data: users, error: userError } = await supabase.from('users').select('id, username').limit(1);
    if (userError || !users || users.length === 0) {
        console.error('No users found to test with.');
        return;
    }
    const shopId = users[0].id;
    const username = users[0].username;
    const year = 2026;
    const amount = 1;

    try {
        const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
        const inserts = months.map(m => ({
            shop_id: shopId,
            month: m,
            amount,
            status: 'pending'
        }));

        console.log(`Inserting/Upserting: ${inserts.length} records for shopId: ${shopId} (${username})`);

        const { data: upsertResult, error: insertError } = await supabase
            .from('monthly_taxes')
            .upsert(inserts, { onConflict: 'shop_id, month' })
            .select();

        if (insertError) {
            console.error('UPSERT ERROR:', JSON.stringify(insertError, null, 2));
        } else {
            console.log('SUCCESS: result count', upsertResult?.length);
        }
    } catch (err) {
        console.error('UNEXPECTED:', err);
    }
}

test();
