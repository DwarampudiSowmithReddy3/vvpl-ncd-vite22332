-- Add message_type_code column to communication_templates
-- This stores the DLT message type code (TXN, PRM, OTP, ALR, SRV, etc.)
-- Required by Kaleyra for DLT compliance in India

ALTER TABLE communication_templates
ADD COLUMN message_type_code VARCHAR(10) NOT NULL DEFAULT 'TXN'
COMMENT 'DLT Message Type Code: TXN (Transactional), PRM (Promotional), OTP (One-Time Password), ALR (Alert), SRV (Service)';
