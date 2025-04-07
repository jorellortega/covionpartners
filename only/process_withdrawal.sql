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
  -- This ensures atomicity and prevents race conditions
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

