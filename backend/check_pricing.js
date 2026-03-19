import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();


const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    try {
        const { data, error } = await supabase.from('business_pricing').select('*');
        if (error) throw error;
        console.log('--- BUSINESS PRICING DATA ---');
        console.table(data);
    } catch (err) {
        console.error('Error:', err.message);
    }
}

run();
