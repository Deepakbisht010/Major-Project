import { supabase } from '../config/supabase.js';

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header.' });
    }

    const token = authHeader.split(' ')[1];

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token.' });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(500).json({ error: 'Internal server error during authentication.' });
  }
};

export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: User not authenticated.' });
    }
    
    // Check if the user's role is admin from their user metadata
    // This assumes you set up role metadata in Supabase (e.g. { "role": "admin" })
    const userRole = req.user.user_metadata?.role;
    
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required.' });
    }

    next();
  } catch (error) {
    console.error('Admin Middleware Error:', error);
    res.status(500).json({ error: 'Internal server error during authorization.' });
  }
};
