CREATE OR REPLACE FUNCTION process_withdrawal(
p_user_id UUID,
p_amount DECIMAL,
p_payment_method VARCHAR,
p_payment_details TEXT
) RETURNS TABLE (
success BOOLEAN,
message TEXT,
withdrawal_id UUID
) LANGUAGE plpgsql AS $$
DECLARE
v_current_balance DECIMAL;
v_withdrawal_id UUID;
v_updated_rows INT;
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
    RETURN QUERY SELECT false, 'Insufficient funds', NULL::UUID;
    RETURN;
  END IF;

  -- Create withdrawal record
  INSERT INTO cvnpartners_withdrawals (id, user_id, amount, payment_method, payment_details, status)
  VALUES (gen_random_uuid(), p_user_id, p_amount, p_payment_method, p_payment_details, 'PENDING')
  RETURNING id INTO v_withdrawal_id;

  -- Commit transaction
  RETURN QUERY SELECT true, 'Withdrawal processed successfully', v_withdrawal_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Rollback transaction
    RAISE;
END;
END;
$$;

-- Function to handle failed withdrawals
CREATE OR REPLACE FUNCTION handle_failed_withdrawal(
p_withdrawal_id UUID,
p_failure_reason TEXT
) RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE
v_user_id UUID;
v_amount DECIMAL;
BEGIN
-- Start transaction
BEGIN
  -- Get withdrawal details
  SELECT user_id, amount INTO v_user_id, v_amount
  FROM cvnpartners_withdrawals
  WHERE id = p_withdrawal_id AND status = 'PENDING';
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Update withdrawal status to FAILED
  UPDATE cvnpartners_withdrawals
  SET status = 'FAILED',
      updated_at = CURRENT_TIMESTAMP,
      payment_details = payment_details || jsonb_build_object('failure_reason', p_failure_reason)
  WHERE id = p_withdrawal_id;
  
  -- Re-credit the user's balance
  UPDATE cvnpartners_user_balances
  SET balance = balance + v_amount,
      last_updated = CURRENT_TIMESTAMP
  WHERE user_id = v_user_id;
  
  -- Create a transaction record for the re-credit
  INSERT INTO cvnpartners_transactions (
    id, user_id, amount, transaction_type, status, created_at
  ) VALUES (
    gen_random_uuid(), 
    v_user_id, 
    v_amount, 
    'WITHDRAWAL_REVERSAL', 
    'COMPLETED', 
    CURRENT_TIMESTAMP
  );
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    -- Rollback transaction
    RAISE;
    RETURN false;
END;
END;
$$;

