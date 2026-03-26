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
      .select('id, business_type, username, email, created_at')
      .eq('auth_id', authId)
      .maybeSingle();

    // Fallback: search by email if auth_id didn't work (robustness point)
    if (!profile && req.user.email) {
      dbLog(`AuthID lookup failed for ${authId}. Trying email fallback: ${req.user.email}`);
      const { data: fallbackProfile } = await supabase
        .from('users')
        .select('id, business_type, username, email, created_at')
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
        const genResult = await generateTaxesForUser(profile.id, profile.business_type, null, profile.created_at);
        taxes = genResult.data;
        dbLog(`Auto-gen DONE. New count: ${taxes?.length || 0}`);
      } catch (genError) {
        dbLog(`Auto-gen FAILED: ${genError.message}. Using frontend fallback logic.`);
        // Generate a 12-month array anyway so the user can see and pay them, 
        // even if the backend is currently having RLS issues saving them.
        const year = new Date().getFullYear();
        const regDate = new Date(profile.created_at || new Date());
        const firstBillableMonthIndex = (regDate.getFullYear() === year) ? regDate.getMonth() : 0;

        taxes = Array.from({ length: 12 }, (_, i) => ({
          shop_id: profile.id,
          month: `${year}-${String(i + 1).padStart(2, '0')}`,
          amount: 0,
          status: i < firstBillableMonthIndex ? 'not_applicable' : 'pending'
        }));
      }
    }

    const basePrice = await getTaxAmount(profile.business_type);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    console.log(`[MonthlyTaxes] User: ${profile.username}, MonthNow: ${currentMonthStr}, Base: ${basePrice}`);

    const registrationDate = new Date(profile.created_at || now);
    const regYear = registrationDate.getFullYear();
    const regMonth = registrationDate.getMonth() + 1;
    const regMonthStr = `${regYear}-${String(regMonth).padStart(2, '0')}`;

    console.log(`[MonthlyTaxes] User: ${profile.username}, RegMonth: ${regMonthStr}, MonthNow: ${currentMonthStr}`);

    const dynamicTaxes = (taxes || []).map(t => {
      // Logic: If month is before registration month, it should be not_applicable
      // UNLESS it was already paid (edge case)
      const isBeforeRegistration = t.month < regMonthStr;
      const isPastMonth = t.month < currentMonthStr;
      const isPaid = t.status === 'paid';

      // Force not_applicable ONLY if it's explicitly marked as such in the database
      // If it's 'pending' or 'paid', we should show it Regardless of the registration date
      // (This fix is for users like Ajay who need to pay months before their official 'create_at' month)
      const isNotApplicable = t.status === 'not_applicable';

      let penalty = 0;
      let displayAmount = basePrice;

      if (isNotApplicable) {
        displayAmount = 0;
        penalty = 0;
      } else if (!isPaid && isPastMonth) {
        penalty = basePrice * 0.05;
        console.log(`[Penalty Applied] Month: ${t.month}, Penalty: ${penalty}`);
      }

      return {
        ...t,
        status: isNotApplicable ? 'not_applicable' : t.status,
        amount: displayAmount,
        penalty: Number(penalty.toFixed(10)),
        penalty_display: isNotApplicable ? '-' : (penalty > 0 ? `5% = ₹${penalty.toFixed(2)}` : '₹0'),
        total: Number((displayAmount + penalty).toFixed(2))
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
    res.status(500).json({
      success: false,
      error: 'Failed to submit complaint. Table may be missing in Supabase.',
      details: error.message
    });
  }
};

export const getNotices = async (req, res) => {
  try {
    const authId = req.user.id;

    // 1. Resolve Auth ID to internal User ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .maybeSingle();

    if (userError || !user) {
      return res.status(404).json({ success: false, error: 'User profile not found' });
    }

    const { data: notices, error } = await supabase
      .from('notices')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({ success: true, notices });
  } catch (error) {
    console.error('getNotices error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch notices' });
  }
};

export const getGovUpdates = async (req, res) => {
  try {
    const authId = req.user.id;

    // 1. Resolve Auth ID to internal User ID and district
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, district')
      .eq('auth_id', authId)
      .maybeSingle();

    if (userError || !user) {
      return res.status(404).json({ success: false, error: 'User profile not found' });
    }

    const { data: updates, error } = await supabase
      .from('government_updates')
      .select('*')
      .or(`district.eq.${user.district},district.eq.all`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({ success: true, updates });
  } catch (error) {
    console.error('getGovUpdates taxpayer error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch government updates' });
  }
};
