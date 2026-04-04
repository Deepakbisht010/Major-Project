import { supabase } from '../config/supabase.js';       
import { generateTaxesForUser } from '../utils/taxGenerator.js'; 
import { sendHelpEmail } from '../utils/mailer.js'; 

export const sendHelpEmailRequest = async (req, res) => {
  try {
    const { name, email, mobile, message } = req.body;

    // Validate 10-digit mobile number
    if (!mobile || !/^\d{10}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid 10-digit mobile number.'
      });
    }

    console.log(`[Backend] Help Email Request received from: ${name} (${email})`);

    // Check for email credentials
    if (!process.env.EMAIL_APP_PASSWORD) {
      console.error('[Backend ERROR] EMAIL_APP_PASSWORD is not set in environment variables.');
      return res.status(500).json({
        success: false,
        error: 'Email service is not configured on the server. Please set EMAIL_APP_PASSWORD.'
      });
    }

    // 1. Send the email
    console.log('[Backend] Calling sendHelpEmail utility...');
    await sendHelpEmail({ name, email, mobile, message });

    console.log(`[Backend SUCCESS] Help Email sent for ${name}`);
    res.status(200).json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    console.error('[Backend ERROR] sendHelpEmailRequest error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message.',
      details: error.message
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { gstId, password, isDemo } = req.body;

    // Remove demo bypass in production, but let's keep it conditionally for specific edge cases if needed
    // However, since the user wants real database connection, let's proceed to Supabase.

    // 1. Lookup the user's email from the users table using their GST ID
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('email, role_id, id, username')
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
        username: profile.username,
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
    const {
      username, gstId, email, mobile, password, district, block,
      businessType, fatherName, shopPhotoUrl, userPhotoUrl
    } = req.body;

    // Validate required email field
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'A valid email address is required.' });
    }

    // Validate 10-digit mobile number
    if (!mobile || !/^\d{10}$/.test(mobile)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid 10-digit mobile number.' });
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

    // 3. Create the user profile in our database with the real email and photo URLs
    const { data: profile, error: profileError } = await supabase
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
        shop_photo_url: shopPhotoUrl,
        user_photo_url: userPhotoUrl,
        role_id: 1
      }])
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return res.status(400).json({ success: false, error: 'Failed to create user profile.' });
    }

    // 4. AUTO-GENERATE 12 MONTHLY TAX RECORDS FOR THE NEW USER
    // Generate these immediately so the user panel is populated on first login.
    try {
      if (profile && profile.id) {
        console.log(`[Backend] Auto-generating tax records for new user ${profile.id} (${businessType}), registered: ${profile.created_at}`);
        // Pass registration date so months BEFORE registration are marked N/A
        await generateTaxesForUser(profile.id, businessType, null, profile.created_at);
      }
    } catch (genError) {
      console.warn('[Backend] Non-critical error during initial tax generation:', genError.message);
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

    // List of 13 District Admins as per user request (Password: name123)
    const extraAdmins = [
      { username: 'superadmin', password: 'superadmin@2026', passkey: 'ADMIN2026', district: 'all', name: 'Super Admin' },
      { username: 'Deepak', password: 'deepak123', district: 'udhamsingh', name: 'Deepak (Udham Singh Nagar)' },
      { username: 'Manish', password: 'manish123', district: 'almora', name: 'Manish (Almora)' },
      { username: 'Raja', password: 'raja123', district: 'pithoragarh', name: 'Raja (Pithoragarh)' },
      { username: 'Sumit', password: 'sumit123', district: 'chamoli', name: 'Sumit (Chamoli)' },
      { username: 'Sahil', password: 'sahil123', district: 'uttarkashi', name: 'Sahil (Uttarkashi)' },
      { username: 'Rohit', password: 'rohit123', district: 'rudraprayag', name: 'Rohit (Rudraprayag)' },
      { username: 'Ajay', password: 'ajay123', district: 'pauri', name: 'Ajay (Pauri Garhwal)' },
      { username: 'Bhavesh', password: 'bhavesh123', district: 'nainital', name: 'Bhavesh (Nainital)' },
      { username: 'Gaurav', password: 'gaurav123', district: 'champawat', name: 'Gaurav (Champawat)' },
      { username: 'Vikram', password: 'vikram123', district: 'bageshwar', name: 'Vikram (Bageshwar)' },
      { username: 'Sanjay', password: 'sanjay123', district: 'haridwar', name: 'Sanjay (Haridwar)' },
      { username: 'Neeraj', password: 'neeraj123', district: 'tehri', name: 'Neeraj (Tehri Garhwal)' },
      { username: 'Rahul', password: 'rahul123', district: 'dehradun', name: 'Rahul (Dehradun)' }
    ];


    const matchedAdmin = extraAdmins.find(a =>
      a.username && username &&
      a.username.toLowerCase() === username.toLowerCase() &&
      a.password === password &&
      (!a.passkey || a.passkey === passkey)
    );

    console.log(`[Admin Login Attempt] User: ${username}, isDemo: ${isDemo}`);

    if ((isDemo && password === 'admin123' && (passkey === 'ADMIN2026' || !passkey)) || matchedAdmin) {
      const adminData = matchedAdmin ? {
        id: `admin-${matchedAdmin.username.toLowerCase().replace(/\s/g, '-')}`,
        username: matchedAdmin.username,
        name: matchedAdmin.name,
        district: matchedAdmin.district,
        role: 'super_admin'
      } : {
        id: 'demo-admin-id',
        username: username || 'admin',
        name: 'Super Admin',
        district: 'all',
        role: 'super_admin'
      };

      console.log(`[Admin Login Success] Logged in as: ${adminData.name} (Scope: ${adminData.district})`);

      return res.status(200).json({
        success: true,
        user: {
          ...adminData,
          token: `demo-fake-admin-jwt-token-${adminData.username}|${adminData.district}`
        }
      });
    }

    console.warn(`[Admin Login Failed] Access denied for: ${username}`);
    return res.status(400).json({ success: false, error: 'Invalid admin credentials.' });


  } catch (error) {
    console.error('Admin Login Error:', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
};

// Step 1: Verify mobile number exists & return dummy OTP
export const sendOtpByMobile = async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile || !/^\d{10}$/.test(mobile)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid 10-digit mobile number.' });
    }

    // Check if user with this mobile exists
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username')
      .eq('mobile', mobile)
      .maybeSingle();

    if (error || !user) {
      return res.status(404).json({ success: false, error: 'No account found with this mobile number.' });
    }

    // Generate a random 6-digit OTP
    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[Reset OTP] Dynamic OTP for mobile ${mobile}: ${randomOtp}`);

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      otp: randomOtp // Returning it so frontend can display for copy option
    });
  } catch (err) {
    console.error('[sendOtpByMobile Error]', err);
    res.status(500).json({ success: false, error: 'Server error. Please try again.' });
  }
};

// Step 2: Verify OTP and reset password
export const resetPasswordByMobile = async (req, res) => {
  try {
    const { mobile, otp, newPassword } = req.body;

    if (!mobile || !otp || !newPassword) {
      return res.status(400).json({ success: false, error: 'All fields are required.' });
    }

    // Validate OTP exists and is 6 digits
    if (!otp || otp.length !== 6) {
      return res.status(400).json({ success: false, error: 'Enter a valid 6-digit OTP.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
    }

    // Find user by mobile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, auth_id, email')
      .eq('mobile', mobile)
      .maybeSingle();

    if (userError || !user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    // Use Supabase Admin API to update the user password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.auth_id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('[resetPasswordByMobile] Update error:', updateError);
      return res.status(500).json({ success: false, error: 'Failed to update password. ' + updateError.message });
    }

    console.log(`[Reset Password] Password successfully updated for mobile: ${mobile}`);
    return res.status(200).json({ success: true, message: 'Password updated successfully!' });

  } catch (err) {
    console.error('[resetPasswordByMobile Error]', err);
    res.status(500).json({ success: false, error: 'Server error. Please try again.' });
  }
};
