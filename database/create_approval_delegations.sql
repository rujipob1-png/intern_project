-- ============================================
-- ตาราง approval_delegations
-- โอนสิทธิ์การอนุมัติ ให้ผู้ปฏิบัติหน้าที่แทน
-- ============================================

CREATE TABLE IF NOT EXISTS approval_delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- คนมอบสิทธิ์ (Director / Central Head / Admin)
  delegator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- คนรับสิทธิ์
  delegate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- role ที่โอนให้ (เช่น 'director', 'central_office_head', 'admin')
  delegated_role VARCHAR(50) NOT NULL,

  -- กลุ่มงานที่ขอบเขตการอนุมัติครอบคลุม (inherited จาก delegator)
  delegated_department VARCHAR(20),

  -- ช่วงเวลาที่มีผล
  start_date DATE NOT NULL,
  end_date   DATE NOT NULL,

  -- เหตุผล เช่น "ลาพักผ่อน", "ลาป่วย"
  reason TEXT,

  -- สถานะ
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- ห้ามโอนสิทธิ์ให้ตัวเอง
  CONSTRAINT no_self_delegation CHECK (delegator_id <> delegate_id),

  -- วันสิ้นสุดต้องมาหลังวันเริ่ม
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Index สำหรับ query เวลา login (เช็ค active delegation ของ delegate)
CREATE INDEX IF NOT EXISTS idx_delegations_delegate_active
  ON approval_delegations (delegate_id, is_active, start_date, end_date);

-- Index สำหรับ query delegations ที่ delegator สร้าง
CREATE INDEX IF NOT EXISTS idx_delegations_delegator
  ON approval_delegations (delegator_id);
