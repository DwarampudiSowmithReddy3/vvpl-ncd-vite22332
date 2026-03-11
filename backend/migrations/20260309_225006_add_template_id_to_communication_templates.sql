-- Add template_id column to communication_templates table
-- This column stores the DLT Template ID from Kaleyra for SMS compliance
-- Note: Column already exists, this migration is for tracking purposes only

-- Simple approach: Try to add column, ignore error if exists
ALTER TABLE communication_templates 
ADD COLUMN template_id VARCHAR(50) NULL 
COMMENT 'DLT Template ID from Kaleyra';
