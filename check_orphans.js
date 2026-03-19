import { supabase } from './backend/src/config/supabase.js';

async function checkOrphans() {
    const { data, error } = await supabase.from('payments').select('id, user_id, amount, status, created_at');
    if (error) return console.error(error);

    console.log(`Total Payments: ${data.length}`);

    for (const p of data) {
        const { data: user } = await supabase.from('users').select('username').eq('id', p.user_id).single();
        if (!user) {
            console.log(`[ORPHAN] Payment ${p.id} (Amount: ${p.amount}) has user_id ${p.user_id} which does NOT exist in users table.`);
        }
    }
}

checkOrphans();
