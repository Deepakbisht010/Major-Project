import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkDistricts() {
    const { data: users, error } = await supabase.from('users').select('username, district');
    if (error) throw error;

    const counts = {};
    users.forEach(u => {
        counts[u.district] = (counts[u.district] || 0) + 1;
    });

    console.log('Districts in DB:', counts);
}

checkDistricts();
