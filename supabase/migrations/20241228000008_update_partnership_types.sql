-- Update partnership_type constraint to include new types: joint_partner and silent_partner
-- This migration updates the existing constraint if it already exists

-- Drop the existing constraint if it exists
ALTER TABLE partner_invitations DROP CONSTRAINT IF EXISTS valid_partnership_type;

-- Add the updated constraint with new partnership types
ALTER TABLE partner_invitations 
ADD CONSTRAINT valid_partnership_type 
CHECK (
  partnership_type IN (
    'strategic', 
    'financial', 
    'operational', 
    'advisory', 
    'joint_venture', 
    'joint_partner', 
    'silent_partner', 
    'distribution', 
    'technology', 
    'marketing', 
    'other'
  ) OR partnership_type IS NULL
);

-- Update the comment
COMMENT ON COLUMN partner_invitations.partnership_type IS 'Type of partnership: strategic, financial, operational, advisory, joint_venture, joint_partner, silent_partner, distribution, technology, marketing, or other';

