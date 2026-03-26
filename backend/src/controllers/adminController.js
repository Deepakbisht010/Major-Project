import { supabase } from '../config/supabase.js';

export const getAllUsers = async (req, res) => {
  try {
    const adminDistrict = req.user.user_metadata?.district;
    let query = supabase.from('users').select(`*, taxes!user_id (id, month, year, amount, status, paid_date), monthly_taxes!shop_id (id, month, amount, status, updated_at), payments!user_id (id, amount, status, paid_at, transaction_id, receipt_number)`);
    const mapDistrict = (d) => { if (!d) return null; const l = d.toLowerCase(); if (l.includes('udhamsinghnagar') || l.includes('udham singh')) return 'udhamsingh'; return l; };
    const targetDistrict = mapDistrict(adminDistrict);

    if (targetDistrict && targetDistrict !== 'all' && targetDistrict !== 'admin') {
      // Use case-insensitive match for robustness
      query = query.ilike('district', `%${targetDistrict}%`);
    }
    const { data: users, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('getAllUsers Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal Server Error', details: error.details, hint: error.hint });
  }
};


export const getMetrics = async (req, res) => {
  try {
    const adminDistrict = req.user.user_metadata?.district;
    const mapDistrict = (d) => { if (!d) return null; const l = d.toLowerCase(); if (l.includes('udhamsinghnagar') || l.includes('udham singh')) return 'udhamsingh'; return l; };
    const targetDistrict = mapDistrict(adminDistrict);
    const isFiltered = targetDistrict && targetDistrict !== 'all' && targetDistrict !== 'admin';

    let userQuery = supabase.from('users').select(`*, taxes!user_id ( status, amount ), monthly_taxes!shop_id ( status, amount )`);
    if (isFiltered) userQuery = userQuery.ilike('district', `%${targetDistrict}%`);
    const { data: users, error: userError } = await userQuery;
    if (userError) throw userError;

    let paymentQuery = supabase.from('payments').select(`amount, status, created_at, user_id, users!user_id!inner(district, username, gst_id, business_type, block)`);
    if (isFiltered) paymentQuery = paymentQuery.ilike('users.district', `%${targetDistrict}%`);
    const { data: payments, error: paymentError } = await paymentQuery;
    if (paymentError) throw paymentError;

    const successfulPayments = (payments || []).filter(p => p.status === 'success' || p.status === 'captured');
    const totalTaxesCollected = successfulPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;

    let paidCount = 0;
    users.forEach(u => {
      if (u.taxes?.some(t => t.status === 'paid') || u.monthly_taxes?.some(t => t.status === 'paid')) paidCount++;
    });

    const metrics = {
      totalUsers: users.length,
      totalTaxesCollected,
      paidShops: paidCount,
      unpaidShops: users.length - paidCount,
      recentPayments: (successfulPayments || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5).map(p => ({ user: p.users.username, gst: p.users.gst_id, amount: p.amount, date: new Date(p.created_at).toLocaleDateString(), status: 'paid' })),
      blockData: Object.values(users.reduce((acc, u) => { const bk = u.block || 'Other'; if (!acc[bk]) acc[bk] = { name: bk, paid: 0, unpaid: 0 }; if (u.taxes?.some(t => t.status === 'paid') || u.monthly_taxes?.some(t => t.status === 'paid')) acc[bk].paid += 1; else acc[bk].unpaid += 1; return acc; }, {})),
      shopTypeData: (() => {
        const counts = users.reduce((acc, u) => {
          const tp = u.business_type || 'Other';
          acc[tp] = (acc[tp] || 0) + 1;
          return acc;
        }, {});
        const colors = ['#E8863A', '#5B9A59', '#821D30', '#4285F4', '#F4B400', '#DB4437', '#9C27B0', '#00BCD4'];
        return Object.entries(counts).map(([name, count], i) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value: users.length > 0 ? Math.round((count / users.length) * 100) : 0,
          color: colors[i % colors.length]
        }));
      })(),
      monthlyData: Object.values(successfulPayments.reduce((acc, p) => {
        const date = new Date(p.created_at);
        const my = date.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
        if (!acc[my]) acc[my] = { month: my, amount: 0, sortKey: date.getTime() };
        acc[my].amount += Number(p.amount) || 0;
        return acc;
      }, {})).sort((a, b) => a.sortKey - b.sortKey).slice(-6)
    };
    res.status(200).json({ success: true, metrics });
  } catch (error) {
    console.error('getMetrics Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal Server Error', details: error.details, hint: error.hint });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const adminDistrict = req.user.user_metadata?.district;
    const mapDistrict = (d) => { if (!d) return d; const lower = d.toLowerCase(); if (lower === 'udhamsinghnagar') return 'udhamsingh'; return lower; };
    const targetDistrict = mapDistrict(adminDistrict);
    const isFiltered = targetDistrict && targetDistrict !== 'all' && targetDistrict !== 'admin';

    let userQuery = supabase.from('users').select(`id, username, district, block,  taxes!user_id (id, amount, status, year, month), monthly_taxes!shop_id (id, amount, status, month), payments!user_id (id, transaction_id, amount, status, created_at)`);
    if (isFiltered) userQuery = userQuery.ilike('district', `%${targetDistrict}%`);
    const { data: users, error } = await userQuery;
    if (error) throw error;

    const yearly = {};
    const blockWise = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyDataMap = {};
    monthNames.forEach(m => monthlyDataMap[m] = { month: m, amount: 0 });

    users.forEach(u => {
      const b = u.block || 'Other';
      if (!blockWise[b]) blockWise[b] = { block: b, total: 0, paid: 0, pending: 0 };
      [...(u.taxes || []), ...(u.monthly_taxes || [])].forEach(t => {
        let year, mIdx;
        if (t.month && typeof t.month === 'string' && t.month.includes('-')) {
          const parts = t.month.split('-'); year = parts[0]; mIdx = parseInt(parts[1]) - 1;
        } else { year = String(t.year); mIdx = (parseInt(t.month) || 1) - 1; }
        const amt = Number(t.amount) || 0;
        if (!yearly[year]) yearly[year] = { year, amount: 0 };
        if (t.status === 'paid' || t.status === 'success') {
          yearly[year].amount += amt; blockWise[b].paid += amt;
          const mName = monthNames[mIdx] || 'Jan'; monthlyDataMap[mName].amount += amt;
        } else if (t.status !== 'not_applicable') { blockWise[b].pending += amt; }
        if (t.status !== 'not_applicable') blockWise[b].total += amt;
      });
    });

    res.status(200).json({ success: true, data: { yearly: Object.values(yearly), monthly: Object.values(monthlyDataMap), blockWise: Object.values(blockWise), payments: users.flatMap(u => (u.payments || []).map(p => ({ ...p, username: u.username, block: u.block }))).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 50) } });
  } catch (error) {
    console.error('getAnalytics Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal Server Error', details: error.details, hint: error.hint });
  }
};

export const getComplaints = async (req, res) => {
  try {
    const adminDistrict = req.user.user_metadata?.district;
    const mapDistrict = (d) => { if (!d) return d; const lower = d.toLowerCase(); if (lower === 'udhamsinghnagar') return 'udhamsingh'; return lower; };
    const targetDistrict = mapDistrict(adminDistrict);
    const isFiltered = targetDistrict && targetDistrict !== 'all' && targetDistrict !== 'admin';
    let query = supabase.from('complaints').select('*, users!inner(username, mobile, district, block)');
    if (isFiltered) query = query.ilike('users.district', `%${targetDistrict}%`);
    const { data: complaints, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    res.status(200).json({ success: true, complaints });
  } catch (error) { res.status(500).json({ success: false }); }
};

export const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params; const { status } = req.body;
    const dbStatus = status === 'actionTaken' ? 'action_taken' : status;
    const { data: curr, error: fError } = await supabase.from('complaints').select('status').eq('id', id).maybeSingle();
    if (fError || !curr) return res.status(404).json({ success: false });
    if (curr.status === 'action_taken' || (curr.status === 'verified' && dbStatus === 'pending')) return res.status(400).json({ success: false });
    const { error: uError } = await supabase.from('complaints').update({ status: dbStatus, updated_at: new Date() }).eq('id', id);
    if (uError) throw uError;
    res.status(200).json({ success: true });
  } catch (error) { res.status(500).json({ success: false }); }
};

export const getAuditLogs = async (req, res) => {
  try {
    const adminDistrict = req.user.user_metadata?.district;
    const mapDistrict = (d) => { if (!d) return d; const lower = d.toLowerCase(); if (lower === 'udhamsinghnagar') return 'udhamsingh'; return lower; };
    const targetDistrict = mapDistrict(adminDistrict);
    const isFiltered = targetDistrict && targetDistrict !== 'all' && targetDistrict !== 'admin';

    const todayISO = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();

    let uQuery = supabase.from('users').select('username, created_at').gte('created_at', todayISO);
    let pQuery = supabase.from('payments').select('amount, created_at, users!inner(username, district)').eq('status', 'success').gte('created_at', todayISO);
    let nQuery = supabase.from('notices').select('title, created_at, users!inner(username, district)').gte('created_at', todayISO);
    let cQuery = supabase.from('complaints').select('reason, created_at, users!inner(username, district)').gte('created_at', todayISO);

    if (isFiltered) {
      uQuery = uQuery.ilike('district', `%${targetDistrict}%`);
      pQuery = pQuery.ilike('users.district', `%${targetDistrict}%`);
      nQuery = nQuery.ilike('users.district', `%${targetDistrict}%`);
      cQuery = cQuery.ilike('users.district', `%${targetDistrict}%`);
    }

    const [uRes, pRes, nRes, cRes] = await Promise.all([uQuery, pQuery, nQuery, cQuery]);

    const logs = [];
    (uRes.data || []).forEach(u => logs.push({ timestamp: u.created_at, action: 'Registration Today', type: 'Registration', performedBy: u.username, details: 'New user registered.' }));
    (pRes.data || []).forEach(p => logs.push({ timestamp: p.created_at, action: 'Payment Made', type: 'Payment', performedBy: p.users?.username, details: `₹${p.amount} received.` }));
    (nRes.data || []).forEach(n => logs.push({ timestamp: n.created_at, action: 'Notice Sent', type: 'Notice', performedBy: 'Admin', details: `Sent to ${n.users?.username}.` }));
    (cRes.data || []).forEach(c => logs.push({ timestamp: c.created_at, action: 'Complaint Filed', type: 'Complaint', performedBy: c.users?.username, details: c.reason.substring(0, 20) }));

    res.status(200).json({ success: true, logs: logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) });
  } catch (error) { res.status(500).json({ success: false }); }
};

export const getGovUpdates = async (req, res) => {
  try {
    const adminDistrict = req.user.user_metadata?.district;
    let query = supabase.from('government_updates').select('*');
    if (adminDistrict && adminDistrict !== 'all' && adminDistrict !== 'admin') {
      query = query.or(`district.eq.${adminDistrict},district.eq.all`);
    }
    const { data: updates, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    res.status(200).json({ success: true, updates });
  } catch (error) { res.status(500).json({ success: false }); }
};

export const postGovUpdate = async (req, res) => {
  try {
    const { title, content, category, district: targetDistrict } = req.body;
    const finalDistrict = targetDistrict || req.user.user_metadata?.district || 'all';

    console.log(`[Admin] Posting Gov Update for district: ${finalDistrict}`);

    const { data: update, error } = await supabase.from('government_updates').insert({
      title,
      content,
      category,
      district: finalDistrict
    }).select().single();
    if (error) throw error;
    res.status(200).json({ success: true, update });
  } catch (error) {
    console.error('postGovUpdate error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteGovUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('government_updates').delete().eq('id', id);
    if (error) throw error;
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('deleteGovUpdate error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const sendBulkNotices = async (req, res) => {
  try {
    const adminDistrict = req.user.user_metadata?.district;
    const mapDistrict = (d) => { if (!d) return d; const lower = d.toLowerCase(); if (lower === 'udhamsinghnagar') return 'udhamsingh'; return lower; };
    const targetDistrict = mapDistrict(adminDistrict);
    const isFiltered = targetDistrict && targetDistrict !== 'all' && targetDistrict !== 'admin';

    const { selectedUsers, month, year, text } = req.body;

    let query = supabase.from('users').select('id, gst_id').in('gst_id', selectedUsers);
    if (isFiltered) query = query.ilike('district', `%${targetDistrict}%`);

    const { data: users, error: uError } = await query;
    if (uError) throw uError;

    const { error: iError } = await supabase.from('notices').insert(users.map(u => ({ user_id: u.id, title: `Notice ${month} ${year}`, message: text, month, year: parseInt(year) })));
    if (iError) throw iError;
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('sendBulkNotices error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAdminProfile = async (req, res) => {
  try {
    const username = req.user.user_metadata?.username;
    const district = req.user.user_metadata?.district;

    let query = supabase
      .from('users')
      .select('username, email, mobile, district, user_photo_url')
      .in('role_id', [2, 3]);

    if (username) {
      // New token format — exact username match
      query = query.eq('username', username);
    } else if (district && district !== 'all') {
      // Old token format — fallback to district match
      query = query.ilike('district', `%${district}%`);
    } else {
      return res.status(400).json({ success: false, error: 'Cannot identify admin: no username or district found in token.' });
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) {
      return res.status(404).json({ success: false, error: 'Admin profile not found in database.' });
    }

    const userProfile = {
      name: data.username,
      email: data.email || `admin.${data.username.toLowerCase()}@etaxpay.uk.gov.in`,
      mobile: data.mobile || '',
      district: data.district,
      photoUrl: data.user_photo_url || ''
    };

    res.status(200).json({ success: true, profile: userProfile });
  } catch (error) {
    console.error('getAdminProfile error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateAdminProfile = async (req, res) => {
  try {
    const username = req.user.user_metadata?.username;
    const district = req.user.user_metadata?.district;

    const { name, email, mobile, photoUrl } = req.body;

    // Build update payload
    const updatePayload = { email, mobile, user_photo_url: photoUrl };
    if (name && name.trim()) updatePayload.username = name.trim();

    let query = supabase.from('users').update(updatePayload).in('role_id', [2, 3]).select().maybeSingle();

    if (username) {
      query = supabase.from('users').update(updatePayload).eq('username', username).in('role_id', [2, 3]).select().maybeSingle();
    } else if (district && district !== 'all') {
      query = supabase.from('users').update(updatePayload).ilike('district', `%${district}%`).in('role_id', [2, 3]).select().maybeSingle();
    } else {
      return res.status(400).json({ success: false, error: 'Cannot identify admin to update.' });
    }

    const { data, error } = await query;

    if (error || !data) {
      return res.status(400).json({ success: false, error: error?.message || 'Update failed' });
    }

    res.status(200).json({
      success: true, profile: {
        name: data.username,
        email: data.email,
        mobile: data.mobile,
        district: data.district,
        photoUrl: data.user_photo_url || ''
      }
    });
  } catch (error) {
    console.error('updateAdminProfile error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
