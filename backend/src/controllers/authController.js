import { supabase } from '../config/supabase.js';

export const loginUser = async (req, res) => {
  try {
    const { gstId, password, isDemo } = req.body;

    // Remove demo bypass in production, but let's keep it conditionally for specific edge cases if needed
    // However, since the user wants real database connection, let's proceed to Supabase.

    // 1. Lookup the user's email from the users table using their GST ID
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('email, role_id, id')
      .eq('gst_id', gstId)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({ success: false, error: 'User not found for this GST ID' });
    }

    // 2. Sign in with Supabase Auth using the retrieved email
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: password
    });

    if (authError || !authData.session) {
      return res.status(401).json({ success: false, error: 'Invalid password' });
    }

    // 3. Return the authenticated user info and token
    return res.status(200).json({
      success: true,
      user: {
        id: profile.id,
        gstId: gstId,
        email: profile.email,
        role: profile.role_id === 1 ? 'user' : 'unknown',
        token: authData.session.access_token
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, error: 'An unexpected error occurred during login' });
  }
};
export const registerUser = async (req, res) => {
  try {
    const { username, gstId, email, mobile, password, district, block, businessType, fatherName } = req.body;

    // Validate required email field
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'A valid email address is required.' });
    }

    // 1. Check if user already exists by GST ID
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('gst_id', gstId)
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User with this GST ID already exists.' });
    }

    // 2. Sign up with Supabase Auth using the real user email
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, gst_id: gstId },
        // Skip email confirmation in development so the user can log in immediately
        emailRedirectTo: undefined
      }
    });

    if (authError) {
      // Provide user-friendly messages for common Supabase Auth errors
      if (
        authError.message?.toLowerCase().includes('rate limit') ||
        authError.status === 429 ||
        authError.code === 'over_email_send_rate_limit' ||
        authError.code === 'email_address_not_authorized'
      ) {
        return res.status(429).json({
          success: false,
          error: 'Too many signup attempts. Please wait a few minutes and try again.'
        });
      }
      if (authError.message?.toLowerCase().includes('already registered')) {
        return res.status(400).json({ success: false, error: 'This email address is already registered.' });
      }
      return res.status(400).json({ success: false, error: authError.message });
    }

    const authId = authData?.user?.id;
    if (!authId) {
      return res.status(400).json({ success: false, error: 'Auth failed to create user.' });
    }

    // 3. Create the user profile in our database with the real email
    const { error: profileError } = await supabase
      .from('users')
      .insert([{
        auth_id: authId,
        username,
        gst_id: gstId,
        mobile,
        email,
        father_name: fatherName,
        district,
        block,
        business_type: businessType,
        role_id: 1
      }]);

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Error code 42501 = Row Level Security policy violation
      if (profileError.code === '42501') {
        return res.status(403).json({
          success: false,
          error: 'Database permission error: RLS policy blocked the insert. Ensure the backend is using the service_role key.'
        });
      }
      return res.status(400).json({ success: false, error: 'Failed to create user profile.' });
    }

    return res.status(201).json({ success: true, message: 'Registration successful!' });

  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ success: false, error: 'Registration failed.' });
  }
};

export const loginAdmin = async (req, res) => {
  try {
    const { username, password, passkey, isDemo } = req.body;

    if (isDemo && password === 'admin123' && passkey === 'ADMIN2026') {
      return res.status(200).json({
        success: true,
        user: {
          id: 'demo-admin-id',
          username,
          role: 'super_admin',
          token: 'demo-fake-admin-jwt-token'
        }
      });
    }

    // Add actual Supabase Admin Server-side logic here later
    return res.status(400).json({ success: false, error: 'Not implemented for production.' });

  } catch (error) {
    console.error('Admin Login Error:', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
};
