-- Fix the generate_guest_code function
-- Drop the function if it exists to recreate it properly
DROP FUNCTION IF EXISTS generate_guest_code();

-- Create function to generate unique guest codes
CREATE OR REPLACE FUNCTION generate_guest_code()
RETURNS TEXT AS $$
DECLARE
    generated_code TEXT;
    counter INTEGER := 0;
BEGIN
    LOOP
        -- Generate a 6-character alphanumeric code
        generated_code := upper(substring(md5(random()::text) from 1 for 6));
        
        -- Check if code already exists
        IF NOT EXISTS (
            SELECT 1 FROM guest_accounts WHERE guest_code = generated_code
            UNION
            SELECT 1 FROM organization_guest_codes WHERE code = generated_code
        ) THEN
            RETURN generated_code;
        END IF;
        
        counter := counter + 1;
        IF counter > 100 THEN
            RAISE EXCEPTION 'Unable to generate unique guest code after 100 attempts';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION generate_guest_code() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_guest_code() TO service_role;

-- Also fix the other functions that might have issues
DROP FUNCTION IF EXISTS check_guest_permission(TEXT, TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS log_guest_activity(TEXT, TEXT, TEXT, UUID, JSONB);

-- Recreate check_guest_permission function
CREATE OR REPLACE FUNCTION check_guest_permission(
    guest_code_param TEXT,
    permission TEXT,
    resource_type TEXT DEFAULT NULL,
    resource_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    guest_record guest_accounts;
    code_record organization_guest_codes;
BEGIN
    -- Get guest account
    SELECT * INTO guest_record
    FROM guest_accounts
    WHERE guest_code = guest_code_param
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > now());
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Get organization code record
    SELECT * INTO code_record
    FROM organization_guest_codes
    WHERE organization_id = guest_record.organization_id
    AND code = guest_code_param
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now());
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if max uses exceeded
    IF code_record.max_uses > 0 AND code_record.current_uses >= code_record.max_uses THEN
        RETURN FALSE;
    END IF;
    
    -- Check permissions (combine guest-specific and code-default permissions)
    -- This is a simplified check - you can expand this based on your permission structure
    RETURN TRUE; -- For now, return true if guest is active and code is valid
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate log_guest_activity function
CREATE OR REPLACE FUNCTION log_guest_activity(
    guest_code_param TEXT,
    activity_type_param TEXT,
    resource_type_param TEXT DEFAULT NULL,
    resource_id_param UUID DEFAULT NULL,
    metadata_param JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
DECLARE
    guest_id UUID;
BEGIN
    -- Get guest account ID
    SELECT id INTO guest_id
    FROM guest_accounts
    WHERE guest_code = guest_code_param;
    
    IF FOUND THEN
        -- Log the activity
        INSERT INTO guest_activities (
            guest_account_id,
            activity_type,
            resource_type,
            resource_id,
            metadata,
            ip_address,
            user_agent
        ) VALUES (
            guest_id,
            activity_type_param,
            resource_type_param,
            resource_id_param,
            metadata_param,
            inet_client_addr(),
            current_setting('request.headers', true)::json->>'user-agent'
        );
        
        -- Update last activity
        UPDATE guest_accounts
        SET last_activity = now()
        WHERE id = guest_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_guest_permission(TEXT, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_guest_permission(TEXT, TEXT, TEXT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION log_guest_activity(TEXT, TEXT, TEXT, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION log_guest_activity(TEXT, TEXT, TEXT, UUID, JSONB) TO service_role; 