import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log("Connecting to Supabase...");
    const { data: users, error: uErr } = await supabase.from('users').select('id').limit(1);

    if (uErr) {
        console.error('Users fetch error:', uErr);
        return;
    }

    if (!users || !users.length) {
        console.log('No users found in database! Please create an account in the UI first.');
        return;
    }

    const userId = users[0].id;
    console.log(`Creating mock taxes for user: ${userId}`);

    // Insert 6 mock taxes
    const mocks = [];
    for (let i = 1; i <= 6; i++) {
        // e.g., 2026-01-15, 2026-02-15
        const dateStr = `2026-${String(i).padStart(2, '0')}-15`;
        mocks.push({
            user_id: userId,
            year: 2026,
            month: i,
            amount: i, // amount starts from 1, up to 6 rupees
            penalty: 0,
            status: 'unpaid',
            due_date: dateStr
        });
    }

    const { error: insErr } = await supabase.from('taxes').insert(mocks);

    if (insErr) {
        console.error('Failed to insert mock taxes:', insErr);
    } else {
        console.log('Successfully generated 6 realistic mock taxes starting from just ₹1!');
    }
}

run();
