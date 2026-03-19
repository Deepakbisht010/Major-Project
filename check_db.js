import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    const { data, error } = await supabase.from('business_pricing').select('*');
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Business Pricing Data:', data);
    }

    const { data: taxes, error: taxError } = await supabase.from('monthly_taxes').select('count', { count: 'exact', head: true });
    console.log('Monthly Taxes Count:', taxes?.length, taxError);
}

checkData();
