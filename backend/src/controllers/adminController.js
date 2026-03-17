import { supabase } from '../config/supabase.js';

export const getAllUsers = async (req, res) => {
  try {
    // In a real scenario you might need to use the Supabase Admin API
    // or query a custom `profiles` public table that maps to auth.users
    const { data: users, error } = await supabase
      .from('profiles') // Assuming a public profiles table exists
      .select('*');

    if (error) {
      throw error;
    }

    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('getAllUsers error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
};

export const getMetrics = async (req, res) => {
  try {
    // Placeholder logic for returning system metrics
    const metrics = {
      totalUsers: 154,
      totalTaxesCollected: 250000,
      activeSessions: 12
    };

    res.status(200).json({ success: true, metrics });
  } catch (error) {
    console.error('getMetrics error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch metrics' });
  }
};
