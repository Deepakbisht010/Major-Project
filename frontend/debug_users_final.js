import { supabase } from './backend/src/config/supabase.js';
import fs from 'fs';

async function checkDetails() {
    const { data, error } = await supabase.from('users').select('*').limit(1);
    if (error) {
        console.error('Error:', error);
        return;
    }
    fs.writeFileSync('sample_user_utf8.json', JSON.stringify(data[0], null, 2));
    console.log('Written to sample_user_utf8.json');
}

checkDetails();
