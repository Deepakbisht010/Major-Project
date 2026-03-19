import { supabase } from './backend/src/config/supabase.js';

async function checkUsers() {
    const { data, count, error } = await supabase.from('users').select('*', { count: 'exact' });
    if (error) {
        console.error('Error fetching users:', error);
        return;
    }
    console.log('Total users in DB:', count);
    console.log('User list:', data.map(u => ({ id: u.id, username: u.username, district: u.district, block: u.block })));
}

checkUsers();
