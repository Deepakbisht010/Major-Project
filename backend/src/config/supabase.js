import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Re-read env configs after any other configs.
const supabaseUrl = process.env.SUPABASE_URL || 'https://jbyvlsqkrprilefdxdhq.supabase.co';

// ⚠️ The backend MUST use the service_role key — not the anon key.
//     The anon key is blocked by Row Level Security (RLS) for table inserts.
//     The service_role key bypasses RLS and is safe ONLY on a private server.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey || supabaseServiceKey === 'your_service_role_key_here') {
  console.error(
    '❌ SUPABASE_SERVICE_ROLE_KEY is not set in backend/.env\n' +
    '   Get it from: Supabase Dashboard → Project Settings → API → service_role\n' +
    '   Without it, database inserts will be blocked by Row Level Security (RLS).'
  );
} else {
  console.log('✅ SUPABASE_SERVICE_ROLE_KEY loaded successfully');
}


export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    // Disable auto session persistence — the backend is stateless.
    persistSession: false,
    autoRefreshToken: false,
  }
});
