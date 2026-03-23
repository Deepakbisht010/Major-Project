import { supabase } from './backend/src/config/supabase.js';

async function enableRealtime() {
    // To enable real-time via SQL in Supabase
    const sql = `
    ALTER PUBLICATION supabase_realtime ADD TABLE users;
    ALTER PUBLICATION supabase_realtime ADD TABLE payments;
  `;

    // Note: We can't run ALTER PUBLICATION via the standard supabase-js client's RPC or Select.
    // We need to tell the user to do it in the dashboard.
    console.log("--------------------------------------------------");
    console.log("PLEASE RUN THIS SQL IN YOUR SUPABASE DASHBOARD:");
    console.log("--------------------------------------------------");
    console.log(sql);
    console.log("--------------------------------------------------");
}

enableRealtime();
