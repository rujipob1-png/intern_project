-- ============================================
-- Atomic Balance Deduction Function
-- ป้องกัน Race Condition เมื่อหักวันลาพร้อมกัน
-- ============================================

-- Function: หักวันลาแบบ atomic พร้อม check balance
CREATE OR REPLACE FUNCTION deduct_leave_balance(
  p_user_id UUID,
  p_balance_field TEXT,
  p_deduct_days INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_result JSON;
BEGIN
  -- Lock the row to prevent concurrent updates
  IF p_balance_field = 'sick_leave_balance' THEN
    SELECT sick_leave_balance INTO v_current_balance
    FROM users WHERE id = p_user_id FOR UPDATE;
  ELSIF p_balance_field = 'personal_leave_balance' THEN
    SELECT personal_leave_balance INTO v_current_balance
    FROM users WHERE id = p_user_id FOR UPDATE;
  ELSIF p_balance_field = 'vacation_leave_balance' THEN
    SELECT vacation_leave_balance INTO v_current_balance
    FROM users WHERE id = p_user_id FOR UPDATE;
  ELSE
    RETURN json_build_object('success', false, 'error', 'Invalid balance field');
  END IF;

  -- Check sufficient balance
  IF v_current_balance < p_deduct_days THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Insufficient balance',
      'current_balance', v_current_balance,
      'required', p_deduct_days
    );
  END IF;

  -- Deduct balance
  v_new_balance := v_current_balance - p_deduct_days;

  IF p_balance_field = 'sick_leave_balance' THEN
    UPDATE users SET sick_leave_balance = v_new_balance, updated_at = NOW() WHERE id = p_user_id;
  ELSIF p_balance_field = 'personal_leave_balance' THEN
    UPDATE users SET personal_leave_balance = v_new_balance, updated_at = NOW() WHERE id = p_user_id;
  ELSIF p_balance_field = 'vacation_leave_balance' THEN
    UPDATE users SET vacation_leave_balance = v_new_balance, updated_at = NOW() WHERE id = p_user_id;
  END IF;

  RETURN json_build_object(
    'success', true,
    'previous_balance', v_current_balance,
    'deducted', p_deduct_days,
    'new_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql;

-- Function: คืนวันลาแบบ atomic (สำหรับ cancel)
CREATE OR REPLACE FUNCTION refund_leave_balance(
  p_user_id UUID,
  p_balance_field TEXT,
  p_refund_days INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Lock the row
  IF p_balance_field = 'sick_leave_balance' THEN
    SELECT sick_leave_balance INTO v_current_balance
    FROM users WHERE id = p_user_id FOR UPDATE;
  ELSIF p_balance_field = 'personal_leave_balance' THEN
    SELECT personal_leave_balance INTO v_current_balance
    FROM users WHERE id = p_user_id FOR UPDATE;
  ELSIF p_balance_field = 'vacation_leave_balance' THEN
    SELECT vacation_leave_balance INTO v_current_balance
    FROM users WHERE id = p_user_id FOR UPDATE;
  ELSE
    RETURN json_build_object('success', false, 'error', 'Invalid balance field');
  END IF;

  v_new_balance := v_current_balance + p_refund_days;

  IF p_balance_field = 'sick_leave_balance' THEN
    UPDATE users SET sick_leave_balance = v_new_balance, updated_at = NOW() WHERE id = p_user_id;
  ELSIF p_balance_field = 'personal_leave_balance' THEN
    UPDATE users SET personal_leave_balance = v_new_balance, updated_at = NOW() WHERE id = p_user_id;
  ELSIF p_balance_field = 'vacation_leave_balance' THEN
    UPDATE users SET vacation_leave_balance = v_new_balance, updated_at = NOW() WHERE id = p_user_id;
  END IF;

  RETURN json_build_object(
    'success', true,
    'previous_balance', v_current_balance,
    'refunded', p_refund_days,
    'new_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql;

-- Function: อนุมัติใบลาขั้นสุดท้ายแบบ atomic (update status + deduct balance ใน transaction เดียว)
CREATE OR REPLACE FUNCTION approve_leave_final(
  p_leave_id UUID,
  p_admin_id UUID,
  p_remarks TEXT DEFAULT 'อนุมัติ'
)
RETURNS JSON AS $$
DECLARE
  v_leave RECORD;
  v_user RECORD;
  v_balance_field TEXT;
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_leave_type_code TEXT;
BEGIN
  -- Lock and fetch the leave
  SELECT l.*, lt.type_code
  INTO v_leave
  FROM leaves l
  JOIN leave_types lt ON lt.id = l.leave_type_id
  WHERE l.id = p_leave_id
  FOR UPDATE OF l;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Leave not found');
  END IF;

  IF v_leave.status != 'approved_level3' THEN
    RETURN json_build_object('success', false, 'error', 'Leave is not ready for final approval', 'current_status', v_leave.status);
  END IF;

  v_leave_type_code := v_leave.type_code;

  -- Determine balance field
  IF v_leave_type_code IN ('SICK', 'PERSONAL', 'VACATION') THEN
    IF v_leave_type_code = 'SICK' THEN v_balance_field := 'sick_leave_balance';
    ELSIF v_leave_type_code = 'PERSONAL' THEN v_balance_field := 'personal_leave_balance';
    ELSIF v_leave_type_code = 'VACATION' THEN v_balance_field := 'vacation_leave_balance';
    END IF;

    -- Lock and fetch user balance
    SELECT * INTO v_user FROM users WHERE id = v_leave.user_id FOR UPDATE;

    IF v_balance_field = 'sick_leave_balance' THEN v_current_balance := v_user.sick_leave_balance;
    ELSIF v_balance_field = 'personal_leave_balance' THEN v_current_balance := v_user.personal_leave_balance;
    ELSIF v_balance_field = 'vacation_leave_balance' THEN v_current_balance := v_user.vacation_leave_balance;
    END IF;

    IF v_current_balance < v_leave.total_days THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Insufficient balance',
        'balance_field', v_balance_field,
        'current_balance', v_current_balance,
        'required', v_leave.total_days
      );
    END IF;

    v_new_balance := v_current_balance - v_leave.total_days;

    -- Deduct balance
    IF v_balance_field = 'sick_leave_balance' THEN
      UPDATE users SET sick_leave_balance = v_new_balance, updated_at = NOW() WHERE id = v_leave.user_id;
    ELSIF v_balance_field = 'personal_leave_balance' THEN
      UPDATE users SET personal_leave_balance = v_new_balance, updated_at = NOW() WHERE id = v_leave.user_id;
    ELSIF v_balance_field = 'vacation_leave_balance' THEN
      UPDATE users SET vacation_leave_balance = v_new_balance, updated_at = NOW() WHERE id = v_leave.user_id;
    END IF;
  END IF;

  -- Update leave status
  UPDATE leaves SET
    status = 'approved_final',
    current_approval_level = 4,
    updated_at = NOW()
  WHERE id = p_leave_id;

  -- Insert approval record
  INSERT INTO approvals (leave_id, approver_id, approval_level, action, comment, action_date)
  VALUES (p_leave_id, p_admin_id, 4, 'approved', p_remarks, NOW());

  RETURN json_build_object(
    'success', true,
    'leave_id', p_leave_id,
    'status', 'approved_final',
    'balance_field', COALESCE(v_balance_field, 'none'),
    'deducted_days', CASE WHEN v_balance_field IS NOT NULL THEN v_leave.total_days ELSE 0 END,
    'new_balance', v_new_balance,
    'user_id', v_leave.user_id,
    'leave_number', v_leave.leave_number
  );
END;
$$ LANGUAGE plpgsql;
