-- Add UNIQUE constraints to investors table for critical fields
-- This ensures data integrity at the database level
-- Fields: email, phone, pan, aadhaar, account_number

-- Add UNIQUE constraint for email
ALTER TABLE investors
ADD UNIQUE KEY `unique_email` (`email`);

-- Add UNIQUE constraint for phone
ALTER TABLE investors
ADD UNIQUE KEY `unique_phone` (`phone`);

-- Add UNIQUE constraint for PAN
ALTER TABLE investors
ADD UNIQUE KEY `unique_pan` (`pan`);

-- Add UNIQUE constraint for Aadhaar
ALTER TABLE investors
ADD UNIQUE KEY `unique_aadhaar` (`aadhaar`);

-- Add UNIQUE constraint for account_number
ALTER TABLE investors
ADD UNIQUE KEY `unique_account_number` (`account_number`);
