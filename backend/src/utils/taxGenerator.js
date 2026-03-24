import { supabase } from '../config/supabase.js';
import { getTaxAmount } from './pricing.js';

/**
 * Shared logic to generate 12 monthly tax records for a user.
 */
export const generateTaxesForUser = async (shopId, businessType, yearInput) => {
    try {
        const year = yearInput || new Date().getFullYear();
        const amount = await getTaxAmount(businessType || 'Other');

        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth(); // 0-indexed (0 = Jan)

        const months = Array.from({ length: 12 }, (_, i) =>
            `${year}-${String(i + 1).padStart(2, '0')}`
        );

        const inserts = months.map((m, index) => {
            const isPastMonth = year < currentYear || (year === currentYear && index < currentMonth);

            return {
                shop_id: shopId,
                month: m,
                amount: isPastMonth ? 0 : amount,
                status: isPastMonth ? 'not_applicable' : 'pending'
            };
        });

        console.log(`[TaxGenerator] Generating ${inserts.length} monthly records for shopId ${shopId} (Type: ${businessType}, Year: ${year})`);

        const { data, error } = await supabase
            .from('monthly_taxes')
            .upsert(inserts, { onConflict: 'shop_id,month' })
            .select();

        if (error) {
            console.error(`[TaxGenerator] Database Error for User ${shopId}:`, error.message);
            throw new Error(`Tax generation failed: ${error.message}`);
        }

        console.log(`[TaxGenerator] SUCCESS: Generated ${data?.length || 0} records at ₹${amount} each.`);
        return { success: true, count: data?.length, amount, data };

    } catch (err) {
        console.error('[TaxGenerator] CRITICAL ERROR:', err);
        throw err;
    }
};
