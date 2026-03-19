import { supabase } from './backend/src/config/supabase.js';
import fs from 'fs';

async function checkHealth() {
    const tables = ['users', 'taxes', 'monthly_taxes', 'payments'];
    let results = '';
    for (const table of tables) {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (error) {
            results += `[Health Check] Table ${table} ERROR: ${error.message}\n`;
        } else {
            results += `[Health Check] Table ${table} has ${count} records.\n`;
        }
    }
    fs.writeFileSync('db_health_report.txt', results);
    console.log('Written to db_health_report.txt');
}

checkHealth();
