import { supabase } from '../config/supabase.js';

/**
 * Fetch tax amount for a business type from business_pricing table.
 * Defaults to 1 if not found.
 */
export const getTaxAmount = async (businessType) => {

    try {
        const normalizedType = (businessType || 'other').toLowerCase();
        console.log(`[Pricing] Looking up amount for: ${normalizedType}`);

        const { data, error } = await supabase
            .from('business_pricing')
            .select('amount')
            .ilike('business_type', normalizedType)
            .maybeSingle();

        if (error) {
            console.error('[Pricing] Database lookup error:', error.message);
            return 1;
        }

        if (!data) {
            console.warn(`[Pricing] No price match for: ${normalizedType}, defaulting to 1`);
            return 1;
        }

        return Number(data.amount);
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
        { business_type: 'General Store', amount: 2 },
        { business_type: 'Medical Store', amount: 1 },
        { business_type: 'Clothing Store', amount: 2 },
        { business_type: 'Electronics Shop', amount: 3 },
        { business_type: 'Restaurant / Eatery', amount: 3 },
        { business_type: 'Hardware Store', amount: 2 },
        { business_type: 'Stationery Shop', amount: 1 },
        { business_type: 'Other', amount: 2 }
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
