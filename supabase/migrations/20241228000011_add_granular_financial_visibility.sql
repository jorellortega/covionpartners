-- Add granular financial visibility controls for partners
-- This allows fine-grained control over what financial metrics partners can see in reports

ALTER TABLE organization_partner_settings
ADD COLUMN IF NOT EXISTS can_see_expenses_in_reports BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS can_see_net_profit_in_reports BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS can_see_overall_roi_in_reports BOOLEAN DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN organization_partner_settings.can_see_expenses_in_reports IS 'Whether partner can see expenses in financial reports';
COMMENT ON COLUMN organization_partner_settings.can_see_net_profit_in_reports IS 'Whether partner can see net profit/loss in financial reports';
COMMENT ON COLUMN organization_partner_settings.can_see_overall_roi_in_reports IS 'Whether partner can see overall company ROI in financial reports (separate from their personal ROI)';

-- Set default values for existing records to maintain current behavior
UPDATE organization_partner_settings
SET 
  can_see_expenses_in_reports = COALESCE(can_see_expenses, true),
  can_see_net_profit_in_reports = true,
  can_see_overall_roi_in_reports = COALESCE(can_see_roi, true)
WHERE can_see_expenses_in_reports IS NULL 
   OR can_see_net_profit_in_reports IS NULL 
   OR can_see_overall_roi_in_reports IS NULL;

