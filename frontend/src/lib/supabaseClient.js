import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://example.supabase.co"
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "public-anon-key"

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Startup connection check ──────────────────────────────────────────────────
// Runs once when this module is first imported (i.e. when the app boots).
// Performs a lightweight query to verify that Supabase is reachable.
(async () => {
    try {
        const { error } = await supabase
            .from('users')
            .select('id')
            .limit(1);

        if (error) {
            // A "relation does not exist" error still means the connection succeeded.
            if (error.code === '42P01') {
                console.log('%c✅ Supabase connected successfully (table "users" not found, but connection is live)', 'color: orange; font-weight: bold;');
            } else {
                console.warn('%c❌ Supabase connection failed:', 'color: red; font-weight: bold;', error.message);
            }
        } else {
            console.log('%c✅ Supabase connected successfully', 'color: green; font-weight: bold;');
        }
    } catch (err) {
        console.error('%c❌ Supabase connection failed (network error):', 'color: red; font-weight: bold;', err.message);
    }
})();
