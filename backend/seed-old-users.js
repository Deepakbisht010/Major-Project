import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const oldUsers = [
    { name: 'Rajesh Kumar', gst: '05AAAPZ2694Q1ZN', block: 'Almora', type: 'general', mobile: '9876543210', status: 'paid', month: 2, year: 2026, date: '2026-02-25T14:30:00Z' },
    { name: 'Priya Devi', gst: '05BBBPZ3584Q2YM', block: 'Hawalbagh', type: 'medical', mobile: '9876543211', status: 'paid', month: 2, year: 2026, date: '2026-02-26T10:15:00Z' },
    { name: 'Mohan Lal', gst: '05CCCPZ4474Q3XN', block: 'Salt', type: 'clothing', mobile: '9876543212', status: 'unpaid', month: 2, year: 2026, date: null },
    { name: 'Kamla Bisht', gst: '05DDDPZ5364Q4WO', block: 'Dwarahat', type: 'electronics', mobile: '9876543213', status: 'paid', month: 1, year: 2026, date: '2026-01-20T16:45:00Z' },
    { name: 'Suresh Rawat', gst: '05EEEPZ6254Q5VP', block: 'Almora', type: 'restaurant', mobile: '9876543214', status: 'unpaid', month: 2, year: 2026, date: null },
    { name: 'Anita Pant', gst: '05FFFPZ7144Q6UQ', block: 'Lamgara', type: 'general', mobile: '9876543215', status: 'paid', month: 2, year: 2026, date: '2026-02-22T09:30:00Z' },
    { name: 'Dinesh Joshi', gst: '05GGGPZ8034Q7TR', block: 'Bhaisiyachana', type: 'hardware', mobile: '9876543216', status: 'unpaid', month: 1, year: 2026, date: null },
    { name: 'Geeta Sharma', gst: '05HHHPZ9924Q8SS', block: 'Hawalbagh', type: 'stationery', mobile: '9876543217', status: 'paid', month: 2, year: 2026, date: '2026-02-24T11:00:00Z' },
    { name: 'Harish Pandey', gst: '05IIIPZ0814Q9RT', block: 'Salt', type: 'general', mobile: '9876543218', status: 'paid', month: 2, year: 2026, date: '2026-02-23T13:20:00Z' },
    { name: 'Kiran Negi', gst: '05JJJPZ1704Q0QU', block: 'Almora', type: 'medical', mobile: '9876543219', status: 'unpaid', month: 2, year: 2026, date: null },
];

async function seed() {
    console.log("Starting seeding of old users...");

    for (const u of oldUsers) {
        const email = `${u.name.toLowerCase().replace(/\s+/g, '.')}@example.com`;

        console.log(`Processing user: ${u.name} (${u.gst})`);

        // 1. Check if user already exists
        const { data: existing } = await supabase.from('users').select('id').eq('gst_id', u.gst).maybeSingle();
        if (existing) {
            console.log(`User ${u.name} already exists. Skipping auth creation.`);
            continue;
        }

        // 2. Create Auth User
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: email,
            password: 'demo123',
            email_confirm: true,
            user_metadata: { username: u.name, gst_id: u.gst }
        });

        if (authError) {
            console.error(`Error creating auth user for ${u.name}:`, authError.message);
            continue;
        }

        const authId = authUser.user.id;

        // 3. Create User Profile
        const { data: profile, error: profileError } = await supabase.from('users').insert([{
            auth_id: authId,
            username: u.name,
            gst_id: u.gst,
            mobile: u.mobile,
            email: email,
            father_name: 'Unknown',
            district: 'almora',
            block: u.block,
            business_type: u.type,
            role_id: 1,
            is_verified: true
        }]).select().single();

        if (profileError) {
            console.error(`Error creating profile for ${u.name}:`, profileError.message);
            continue;
        }

        const userId = profile.id;

        // 4. Create Tax Record
        const { error: taxError } = await supabase.from('taxes').insert([{
            user_id: userId,
            year: u.year,
            month: u.month,
            amount: 500, // Default amount
            status: u.status,
            due_date: `${u.year}-${String(u.month).padStart(2, '0')}-15`,
            paid_date: u.date
        }]);

        if (taxError) {
            console.error(`Error creating tax for ${u.name}:`, taxError.message);
        } else {
            console.log(`Successfully added ${u.name}`);
        }
    }

    console.log("Seeding complete!");
}

seed();
