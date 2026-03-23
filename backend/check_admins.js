import { supabase } from './src/config/supabase.js';
import dotenv from 'dotenv';
dotenv.config();

async function checkAdmins() {
    const { data: admins, error } = await supabase.from('admins').select('*');
    if (error) {
        console.error('Error fetching admins:', error);
        return;
    }
    console.log('Admins list:', admins.map(a => ({ username: a.username, district: a.district })));
}

checkAdmins();
