import { supabase } from '../config/supabase.js';

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Log headers (requested in Step 6)
    console.log(`[Backend Auth] Incoming Request headers detected. Auth Header present: ${!!authHeader}`);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('[Backend Auth] Missing or malformed Bearer token.');
      return res.status(401).json({ error: 'Missing or invalid authorization header.' });
    }

    const token = authHeader.split(' ')[1];

    // --- Demo logic for development (handles district-specific fake tokens) ---

    // ------------------------------------

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('Auth verification failed:', error?.message || 'No user found');
      return res.status(401).json({ error: 'Unauthorized: Invalid token.', details: error?.message });
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
      const userRole = req.user.user_metadata?.role;

    const validRoles = ['admin', 'super_admin', 'district_admin'];

    if (!validRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden: Admin access required.' });
    }

    next();
  } catch (error) {
    console.error('Admin Middleware Error:', error);
    res.status(500).json({ error: 'Internal server error during authorization.' });
  }
};

  
