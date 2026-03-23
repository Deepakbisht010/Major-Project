import { supabase } from '../config/supabase.js';

export const getAllUsers = async (req, res) => {
  try {
    const adminDistrict = req.user.user_metadata?.district;

    let query = supabase
      .from('users')
      .select(`
        *,
        taxes!user_id (id, month, year, amount, status, paid_date),
        monthly_taxes!shop_id (id, month, amount, status, updated_at),
        payments!user_id (id, amount, status, paid_at, transaction_id, receipt_number)
      `);


    // Handle district key aliases (e.g., udhamsinghnagar vs udhamsingh)
    const mapDistrict = (d) => {
      if (!d) return d;
      const lower = d.toLowerCase();
      if (lower === 'udhamsinghnagar') return 'udhamsingh';
      return lower;
    };

    const targetDistrict = mapDistrict(adminDistrict);

    if (targetDistrict && targetDistrict !== 'all' && targetDistrict !== 'admin') {
      console.log(`[Admin] Filtering users for mapping district: ${targetDistrict} (Original: ${adminDistrict})`);
      query = query.eq('district', targetDistrict);
    }


    const { data: users, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('[Admin] Supabase Query Error:', error);
      throw error;
    }

    console.log(`[Admin] Successfully fetched ${users?.length || 0} users (District filter: ${adminDistrict || 'none'})`);
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('getAllUsers error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
};


export const getMetrics = async (req, res) => {
  try {
    const adminDistrict = req.user.user_metadata?.district;
    console.log(`[Admin Metrics] Fetching for district: ${adminDistrict}`);

    const mapDistrict = (d) => {
      if (!d) return d;
      const lower = d.toLowerCase();
      if (lower === 'udhamsinghnagar') return 'udhamsingh';
      return lower;
    };
    const targetDistrict = mapDistrict(adminDistrict);
    const isFiltered = targetDistrict && targetDistrict !== 'all' && targetDistrict !== 'admin';

    // 1. Fetch total users (filtered by district if needed)
    let userQuery = supabase.from('users').select(`
      *,
      taxes!user_id ( status, amount ),
      monthly_taxes!shop_id ( status, amount )
    `);

    if (isFiltered) userQuery = userQuery.eq('district', targetDistrict);
    const { data: users, error: userError } = await userQuery;

    if (userError) throw userError;

    // 2. Fetch successful payments (with inner join to filter by user district at DB level)
    let paymentQuery = supabase.from('payments').select(`
      amount, status, created_at, user_id, 
      users!user_id!inner(district, username, gst_id, business_type, block)
    `);

    if (isFiltered) {
      paymentQuery = paymentQuery.eq('users.district', targetDistrict);
    }

    const { data: payments, error: paymentError } = await paymentQuery;
    if (paymentError) {
      console.error('[Admin Metrics] Payment query error:', paymentError);
      throw paymentError;
    }

    const successfulPayments = (payments || []).filter(p => p.status === 'success' || p.status === 'captured');
    const totalTaxesCollected = successfulPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;

    console.log(`[Admin Metrics] Total collected: ${totalTaxesCollected} from ${successfulPayments.length} successful payments`);

    // 3. Paid vs Unpaid calculation
    let paidCount = 0;
    users.forEach(u => {
      // A user is considered "paid" if they have ANY record with 'paid' status
      const hasTraditionalPaid = u.taxes?.some(t => t.status === 'paid');
      const hasMonthlyPaid = u.monthly_taxes?.some(t => t.status === 'paid');
      if (hasTraditionalPaid || hasMonthlyPaid) paidCount++;
    });

    const metrics = {
      totalUsers: users.length,
      totalTaxesCollected,
      paidShops: paidCount,
      unpaidShops: users.length - paidCount,
      recentPayments: (successfulPayments || [])
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
        .map(p => ({
          user: p.users.username,
          gst: p.users.gst_id,
          amount: p.amount,
          date: p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A',
          status: 'paid'
        })),
      blockData: Object.values(users.reduce((acc, u) => {
        const block = u.block || 'Other';
        if (!acc[block]) acc[block] = { name: block, paid: 0, unpaid: 0 };
        const isPaid = u.taxes?.some(t => t.status === 'paid') || u.monthly_taxes?.some(t => t.status === 'paid');
        if (isPaid) acc[block].paid += 1; else acc[block].unpaid += 1;
        return acc;
      }, {})),
      shopTypeData: Object.entries(users.reduce((acc, u) => {
        const type = u.business_type || 'Other';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {})).map(([name, count]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: users.length > 0 ? Math.round((count / users.length) * 100) : 0,
        color: name === 'medical' ? '#5B9A59' : name === 'general' ? '#E8863A' : '#821D30'
      })),
      monthlyData: Object.values(successfulPayments.reduce((acc, p) => {
        const date = new Date(p.created_at);
        const monthYear = date.toLocaleString('en-IN', { month: 'short' });
        if (!acc[monthYear]) acc[monthYear] = { month: monthYear, amount: 0, sortKey: date.getTime() };
        acc[monthYear].amount += Number(p.amount) || 0;
        return acc;
      }, {})).sort((a, b) => a.sortKey - b.sortKey).slice(-6)
    };

    res.status(200).json({ success: true, metrics });

  } catch (error) {
    console.error('getMetrics error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch metrics' });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const adminDistrict = req.user.user_metadata?.district;
    const mapDistrict = (d) => {
      if (!d) return d;
      const lower = d.toLowerCase();
      if (lower === 'udhamsinghnagar') return 'udhamsingh';
      return lower;
    };
    const targetDistrict = mapDistrict(adminDistrict);
    const isFiltered = targetDistrict && targetDistrict !== 'all' && targetDistrict !== 'admin';

    // 1. Fetch Users and their data
    let userQuery = supabase.from('users').select(`
      id, username, district, block, business_type,
      taxes!user_id (id, amount, status, year, month),
      monthly_taxes!shop_id (id, amount, status, month),
      payments!user_id (amount, status, created_at)
    `);

    if (isFiltered) userQuery = userQuery.eq('district', targetDistrict);
    const { data: users, error } = await userQuery;
    if (error) throw error;

    // 2. Aggregate Data
    const yearly = {};
    const monthly = {};
    const blockWise = {};
    const shopType = {};

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyDataMap = {};
    monthNames.forEach(m => monthlyDataMap[m] = { month: m });

    users.forEach(u => {
      // Block-wise
      const b = u.block || 'Other';
      if (!blockWise[b]) blockWise[b] = { block: b, total: 0, paid: 0, pending: 0, shops: 0 };
      blockWise[b].shops += 1;

      // Shop Type
      const st = u.business_type || 'Other';
      if (!shopType[st]) shopType[st] = { type: st, shops: 0, collected: 0, pending: 0 };
      shopType[st].shops += 1;

      // Process Taxes
      [...(u.taxes || []), ...(u.monthly_taxes || [])].forEach(t => {
        const year = String(t.year || new Date().getFullYear());
        const mIdx = (t.month || 1) - 1;
        const mName = monthNames[mIdx];
        const amt = Number(t.amount) || 0;

        if (!yearly[year]) yearly[year] = { year: year, amount: 0 };
        if (t.status === 'paid') {
          yearly[year].amount += amt;
          blockWise[b].paid += amt;
          shopType[st].collected += amt;

          // Monthly Growth
          if (!monthlyDataMap[mName][year]) monthlyDataMap[mName][year] = 0;
          monthlyDataMap[mName][year] += amt;
        } else {
          blockWise[b].pending += amt;
          shopType[st].pending += amt;
        }
        blockWise[b].total += amt;
      });

    });

    res.status(200).json({
      success: true,
      data: {
        yearly: Object.values(yearly),
        monthly: Object.values(monthlyDataMap),
        blockWise: Object.values(blockWise),
        shopType: Object.values(shopType)
      }
    });
  } catch (error) {
    console.error('getAnalytics error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
};

export const getComplaints = async (req, res) => {
  try {
    const adminDistrict = req.user.user_metadata?.district;
    const mapDistrict = (d) => {
      if (!d) return d;
      const lower = d.toLowerCase();
      if (lower === 'udhamsinghnagar') return 'udhamsingh';
      return lower;
    };
    const targetDistrict = mapDistrict(adminDistrict);
    const isFiltered = targetDistrict && targetDistrict !== 'all' && targetDistrict !== 'admin';

    let query = supabase
      .from('complaints')
      .select('*, users!user_id(username, mobile, district, block)');

    // In PostgREST, filtering on join results needs a special syntax
    if (isFiltered) query = query.filter('users.district', 'eq', targetDistrict);

    const { data: complaints, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({ success: true, complaints });
  } catch (error) {
    console.error('getComplaints error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch complaints' });
  }
};


