-- Add is_approved column to withdrawals table
ALTER TABLE cvnpartners_withdrawals 
ADD COLUMN is_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN approval_threshold DECIMAL DEFAULT 1000,
ADD COLUMN requires_approval BOOLEAN GENERATED ALWAYS AS (amount >= approval_threshold) STORED;

-- Create index for faster queries on withdrawals requiring approval
CREATE INDEX idx_cvnpartners_withdrawals_requires_approval 
ON cvnpartners_withdrawals(requires_approval) 
WHERE requires_approval = TRUE;

-- Update the process_withdrawal function to handle approval requirements
CREATE OR REPLACE FUNCTION process_withdrawal(
p_user_id UUID,
p_amount DECIMAL,
p_payment_method VARCHAR,
p_payment_details TEXT
) RETURNS TABLE (
success BOOLEAN,
message TEXT,
withdrawal_id UUID,
requires_approval BOOLEAN
) LANGUAGE plpgsql AS $$
DECLARE
v_current_balance DECIMAL;
v_withdrawal_id UUID;
v_updated_rows INT;
v_requires_approval BOOLEAN;
v_approval_threshold DECIMAL := 1000; -- Default threshold
BEGIN
-- Start transaction
BEGIN
  -- Attempt to update balance with a conditional check
  UPDATE cvnpartners_user_balances
  SET balance = balance - p_amount,
      last_updated = CURRENT_TIMESTAMP
  WHERE user_id = p_user_id 
  AND balance >= p_amount
  RETURNING balance INTO v_current_balance;
  
  -- Check if update was successful by getting affected rows
  GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
  
  IF v_updated_rows = 0 THEN
    -- No rows updated means insufficient funds
    RETURN QUERY SELECT false, 'Insufficient funds', NULL::UUID, FALSE;
    RETURN;
  END IF;

  -- Check if withdrawal requires approval
  v_requires_approval := (p_amount >= v_approval_threshold);
  
  -- Set initial status based on approval requirement
  -- If requires approval, set to PENDING_APPROVAL, otherwise PENDING
  
  -- Create withdrawal record
  INSERT INTO cvnpartners_withdrawals (
    id, 
    user_id, 
    amount, 
    payment_method, 
    payment_details, 
    status,
    approval_threshold,
    is_approved
  )
  VALUES (
    gen_random_uuid(), 
    p_user_id, 
    p_amount, 
    p_payment_method, 
    p_payment_details, 
    CASE WHEN v_requires_approval THEN 'PENDING_APPROVAL' ELSE 'PENDING' END,
    v_approval_threshold,
    NOT v_requires_approval -- Auto-approve if below threshold
  )
  RETURNING id INTO v_withdrawal_id;

  -- Commit transaction
  RETURN QUERY SELECT 
    true, 
    CASE 
      WHEN v_requires_approval THEN 'Withdrawal request submitted for approval' 
      ELSE 'Withdrawal processed successfully' 
    END, 
    v_withdrawal_id,
    v_requires_approval;
EXCEPTION
  WHEN OTHERS THEN
    -- Rollback transaction
    RAISE;
END;
END;
$$;

-- Function for admins to approve withdrawals
CREATE OR REPLACE FUNCTION approve_withdrawal(
p_withdrawal_id UUID,
p_admin_id UUID,
p_approved BOOLEAN,
p_admin_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE
v_status VARCHAR;
BEGIN
-- Start transaction
BEGIN
  -- Get current status
  SELECT status INTO v_status
  FROM cvnpartners_withdrawals
  WHERE id = p_withdrawal_id;
  
  IF v_status != 'PENDING_APPROVAL' THEN
    RETURN false;
  END IF;
  
  -- Update withdrawal with approval decision
  UPDATE cvnpartners_withdrawals
  SET 
    is_approved = p_approved,
    status = CASE WHEN p_approved THEN 'PENDING' ELSE 'REJECTED' END,
    updated_at = CURRENT_TIMESTAMP,
    payment_details = payment_details || jsonb_build_object(
      'admin_id', p_admin_id,
      'approval_date', CURRENT_TIMESTAMP,
      'admin_notes', p_admin_notes
    )
  WHERE id = p_withdrawal_id;
  
  -- If rejected, refund the amount
  IF NOT p_approved THEN
    PERFORM handle_failed_withdrawal(p_withdrawal_id, 'Rejected by admin: ' || COALESCE(p_admin_notes, 'No reason provided'));
  END IF;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    -- Rollback transaction
    RAISE;
    RETURN false;
END;
END;
$$;

