-- Fix communication_templates type column to accept more values
-- The type column was too restrictive with only SMS and Email
-- Now it accepts: SMS, Email, TXN, and other communication types

-- Modify the type column to accept more values
ALTER TABLE communication_templates 
MODIFY COLUMN `type` VARCHAR(50) NOT NULL 
COMMENT 'Communication type: SMS, Email, TXN, etc.';
