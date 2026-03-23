import { supabase } from './backend/src/config/supabase.js';
import fs from 'fs';

async function checkDistricts() {
    const { data, error } = await supabase.from('users').select('district');
    const counts = data.reduce((acc, u) => {
        acc[u.district] = (acc[u.district] || 0) + 1;
        return acc;
    }, {});
    fs.writeFileSync('district_distribution.txt', JSON.stringify(counts, null, 2));
}

checkDistricts();
