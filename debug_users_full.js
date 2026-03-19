import { supabase } from './backend/src/config/supabase.js';

async function checkDetails() {
    const { data, error } = await supabase.from('users').select('*').limit(1);
    if (error) {
        console.error('Error:', error);
        return;
    }
    console.log('Sample User Full Record:', JSON.stringify(data[0], null, 2));
}

checkDetails();
