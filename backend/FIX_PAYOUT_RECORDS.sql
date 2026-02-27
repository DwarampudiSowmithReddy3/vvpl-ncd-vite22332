-- Fix the manually imported payout records
-- Change from February 2026 to March 2026
-- Change payout date from 15-Feb-2026 to 05-Mar-2026

UPDATE interest_payouts
SET 
    payout_month = 'March 2026',
    payout_date = '05-Mar-2026',
    updated_at = NOW()
WHERE payout_month = 'February 2026'
AND is_active = 1;

-- Verify the changes
SELECT 
    investor_id,
    series_id,
    payout_month,
    payout_date,
    amount,
    status
FROM interest_payouts
WHERE is_active = 1
ORDER BY payout_month, investor_id;
