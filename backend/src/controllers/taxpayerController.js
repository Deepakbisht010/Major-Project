import { supabase } from '../config/supabase.js';

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
