import { supabase } from '../config/supabase.js';

/**
 * Fetch tax amount for a business type from business_pricing table.
 * Defaults to 1 if not found.
 */
export const getTaxAmount = async (businessType, shopId, month) => {

    try {
        const normalizedType = (businessType || 'other').toLowerCase();

        let { data, error } = await supabase
            .from('business_pricing')
            .select('amount')
            .ilike('business_type', normalizedType)
            .maybeSingle();

        if (error) {
            console.error('[Pricing] Database lookup error:', error.message);
            data = { amount: 1 }; // Fallback
        }

        let baseAmount = Number(data?.amount || 1);
        let finalAmount = baseAmount;
        let penalty = 0;

        // Check for 2% penalty (Point: Late Payment)
        if (shopId && month) {
            // Check if there are any pending months BEFORE the one being paid
            // OR if the month being paid is itself older than current month
            const now = new Date();
            const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

            const isPastMonth = month < currentMonthStr;

            // Check if there are any 'unpaid' / 'pending' taxes for this shop before the current month
            const { count: pendingCount } = await supabase
                .from('monthly_taxes')
                .select('*', { count: 'exact', head: true })
                .eq('shop_id', shopId)
                .lt('month', currentMonthStr)
                .neq('status', 'paid');

            if (isPastMonth || (pendingCount && pendingCount > 0)) {
                penalty = baseAmount * 0.05;
                finalAmount = baseAmount + penalty;
                console.log(`[Pricing] Penalty applied (+5%): ${penalty} for shop ${shopId} (Month: ${month}, Past: ${isPastMonth}, PendingMonths: ${pendingCount})`);
            }
        }

        return Number(finalAmount.toFixed(2));
    } catch (err) {
        console.error('getTaxAmount error:', err);
        return 1;
    }
};

/**
 * Seed default pricing data into business_pricing table.
 */
export const seedPricingData = async () => {
    const defaultData = [
        { business_type: 'General Store', amount: 500 },
        { business_type: 'general', amount: 500 },
        { business_type: 'Medical Store', amount: 750 },
        { business_type: 'medical', amount: 750 },
        { business_type: 'Clothing Store', amount: 1000 },
        { business_type: 'clothes', amount: 1000 },
        { business_type: 'Electronics Shop', amount: 1500 },
        { business_type: 'electronics', amount: 1500 },
        { business_type: 'Restaurant / Eatery', amount: 1200 },
        { business_type: 'restaurant', amount: 1200 },
        { business_type: 'Hardware Store', amount: 800 },
        { business_type: 'hardware', amount: 800 },
        { business_type: 'Stationery Shop', amount: 400 },
        { business_type: 'stationery', amount: 400 },
        { business_type: 'Other', amount: 500 },
        { business_type: 'other', amount: 500 }
    ];

    const { error } = await supabase
        .from('business_pricing')
        .upsert(defaultData, { onConflict: 'business_type' });

    if (error) {
        console.error('Seed pricing error:', error.message);
        return { success: false, error: error.message };
    }
    return { success: true };
};
