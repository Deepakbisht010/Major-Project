import { supabase } from '../config/supabase.js';
import { getTaxAmount } from './pricing.js';

/**
 * Shared logic to generate 12 monthly tax records for a user.
 * @param {string} shopId - The user's profile ID
 * @param {string} businessType - Type of business
 * @param {number} yearInput - The year to generate for (defaults to current year)
 * @param {string} registrationDate - ISO date string of when user registered (e.g. "2026-01-21T...")
 */
export const generateTaxesForUser = async (shopId, businessType, yearInput, registrationDate) => {
    try {
        const year = yearInput || new Date().getFullYear();
        const amount = await getTaxAmount(businessType || 'Other');

        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth(); // 0-indexed (0 = Jan)

        // Determine the first billable month (0-indexed)
        // If registrationDate is provided, billing starts from that month
        // Otherwise, billing starts from January of the current year
        let firstBillableMonth = 0; // default: January
        if (registrationDate) {
            const regDate = new Date(registrationDate);
            if (regDate.getFullYear() === year) {
                firstBillableMonth = regDate.getMonth(); // 0-indexed
            }
        }

        const months = Array.from({ length: 12 }, (_, i) =>
            `${year}-${String(i + 1).padStart(2, '0')}`
        );

        const inserts = months.map((m, index) => {
            // Month is N/A if it is before the registration month
            const isBeforeRegistration = index < firstBillableMonth;

            // Month is "coming soon" if it's a future month (after current real-world month)
            const isFutureMonth = year > currentYear || (year === currentYear && index > currentMonth);

            let status;
            let monthAmount;

            if (isBeforeRegistration) {
                status = 'not_applicable';
                monthAmount = 0;
            } else {
                // Both current and future billable months are 'pending'
                // Frontend handles the 'Coming Soon' display based on date
                status = 'pending';
                monthAmount = amount;
            }

            return {
                shop_id: shopId,
                month: m,
                amount: monthAmount,
                status: status
            };
        });

        console.log(`[TaxGenerator] Generating ${inserts.length} monthly records for shopId ${shopId} (Type: ${businessType}, Year: ${year}, FirstBillable: month ${firstBillableMonth + 1})`);

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

