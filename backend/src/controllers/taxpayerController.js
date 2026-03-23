console.log('--- TAXPAYER CONTROLLER LOADED ---');
import { supabase } from '../config/supabase.js';
import { getTaxAmount } from '../utils/pricing.js';
import { generateTaxesForUser } from '../utils/taxGenerator.js';
import fs from 'fs';

const dbLog = (msg) => {
  try {
    fs.appendFileSync('backend_debug.log', `[${new Date().toISOString()}] ${msg}\n`);
  } catch (e) {
    console.warn('Logging failed:', e.message);
  }
};

export const getTaxpayerProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    // Assuming you have a 'users' or 'profiles' table for extra user data
    // Fallback simply returns the authenticated user data from req
    return res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('getTaxpayerProfile error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
};

export const getTaxpayerTaxes = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch taxes for this specific user
    const { data: taxes, error } = await supabase
      .from('taxes')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    res.status(200).json({ success: true, taxes });
  } catch (error) {
    console.error('getTaxpayerTaxes error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch taxes' });
  }
};

export const getMonthlyTaxes = async (req, res) => {
  try {
    const authId = req.user.id;
    dbLog(`Fetching taxes for authId: ${authId}`);

    let { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, business_type, username, email')
      .eq('auth_id', authId)
      .maybeSingle();

    // Fallback: search by email if auth_id didn't work (robustness point)
    if (!profile && req.user.email) {
      dbLog(`AuthID lookup failed for ${authId}. Trying email fallback: ${req.user.email}`);
      const { data: fallbackProfile } = await supabase
        .from('users')
        .select('id, business_type, username, email')
        .eq('email', req.user.email)
        .maybeSingle();

      if (fallbackProfile) {
        profile = fallbackProfile;
        dbLog(`Fallback SUCCESS! Found user ${profile.username} by email.`);
      }
    }

    if (!profile) {
      dbLog(`Profile FAIL: User not found despite fallback efforts.`);
      return res.status(404).json({ success: false, error: 'User profile not found' });
    }

    dbLog(`Profile found: ${profile.username} (ID: ${profile.id}, Email: ${profile.email})`);

    let { data: taxes, error } = await supabase
      .from('monthly_taxes')
      .select('*')
      .eq('shop_id', profile.id)
      .order('month', { ascending: true });

    if (error) {
      dbLog(`DB Error: ${error.message}`);
      throw error;
    }

    dbLog(`Taxes count on start: ${taxes?.length || 0}`);

    if (!taxes || taxes.length === 0) {
      dbLog(`Triggering auto-gen for ${profile.id}...`);
      try {
        const genResult = await generateTaxesForUser(profile.id, profile.business_type);
        taxes = genResult.data;
        dbLog(`Auto-gen DONE. New count: ${taxes?.length || 0}`);
      } catch (genError) {
        dbLog(`Auto-gen FAILED: ${genError.message}. Using frontend fallback logic.`);
        // Generate a 12-month array anyway so the user can see and pay them, 
        // even if the backend is currently having RLS issues saving them.
        const year = new Date().getFullYear();
        taxes = Array.from({ length: 12 }, (_, i) => ({
          shop_id: profile.id,
          month: `${year}-${String(i + 1).padStart(2, '0')}`,
          amount: 0, // will be overridden below
          status: 'pending'
        }));
      }
    }

    const basePrice = await getTaxAmount(profile.business_type);

    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const dynamicTaxes = (taxes || []).map(t => {
      const isPastMonth = t.month < currentMonthStr;
      const isPaid = t.status === 'paid';

      // Calculate penalty (only for unpaid past months in this simplified view)
      // or if any month before this one is unpaid?
      // For the UI, let's keep it consistent: if it's past and not paid, show penalty.
      let penalty = 0;
      if (!isPaid && isPastMonth) {
        penalty = basePrice * 0.02;
      }

      return {
        ...t,
        amount: basePrice, // Base amount
        penalty: Number(penalty.toFixed(2)),
        total: Number((basePrice + penalty).toFixed(2))
      };
    });

    dbLog(`Returning ${dynamicTaxes.length} taxes to frontend with breakdown.`);
    res.status(200).json({ success: true, taxes: dynamicTaxes });
  } catch (error) {
    dbLog(`CRITICAL: ${error.message}`);
    console.error('[Backend] getMonthlyTaxes CRITICAL error:', error);
    res.status(200).json({ success: false, error: 'Failed to fetch monthly taxes', taxes: [] });
  }
};


export const generateMonthlyTaxes = async (req, res) => {
  try {
    const { shopId, year } = req.body;
    console.log(`[Backend] generateMonthlyTaxes request: shopId=${shopId}, year=${year}`);

    if (!shopId) {
      return res.status(400).json({ success: false, error: 'shopId is required' });
    }

    // 1. Get shop type from users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('business_type')
      .eq('id', shopId)
      .maybeSingle();

    if (userError || !user) {
      console.warn(`[Backend] User profile not found for shopId: ${shopId}`);
      return res.status(404).json({ success: false, error: 'User profile not found. Tax generation aborted.' });
    }

    const { data: upsertResult, amount } = await generateTaxesForUser(shopId, user.business_type, year);

    console.log('[Backend] Monthly taxes successfully generated/synchronized.');
    res.status(200).json({ success: true, message: 'Monthly taxes generated', amount, count: upsertResult?.length });
  } catch (error) {
    console.error('[Backend] generateMonthlyTaxes CRITICAL error:', error);
    res.status(200).json({ success: false, error: error.message || 'Internal Server Error' });
  }
};
export const submitComplaint = async (req, res) => {
  try {
    const authId = req.user.id;
    const { shopName, location, reason, description, photoUrl } = req.body;

    // 1. Resolve Auth ID to internal User ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .maybeSingle();

    if (userError || !user) {
      console.error('User lookup failed for complaint:', userError);
      return res.status(404).json({ success: false, error: 'User profile not found' });
    }

    // 2. Insert complaint using internal user.id
    const { data: complaint, error } = await supabase
      .from('complaints')
      .insert([{
        user_id: user.id,
        shop_name: shopName,
        location,
        reason,
        description,
        photo_url: photoUrl,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, complaint });
  } catch (error) {
    console.error('submitComplaint error:', error);
    res.status(500).json({ success: false, error: 'Failed to submit complaint' });
  }
};
