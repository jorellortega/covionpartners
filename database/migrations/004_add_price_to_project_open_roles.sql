-- Add price and price_type columns to project_open_roles table
ALTER TABLE project_open_roles 
ADD COLUMN price DECIMAL(10, 2),
ADD COLUMN price_type VARCHAR(20) DEFAULT 'hourly';

-- Add comment to explain the price_type values
COMMENT ON COLUMN project_open_roles.price_type IS 'Price type: hourly, daily, weekly, monthly, yearly, fixed'; 