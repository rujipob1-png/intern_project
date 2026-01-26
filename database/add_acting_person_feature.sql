-- ============================================
-- Migration: เพิ่มฟีเจอร์ผู้ปฏิบัติหน้าที่แทน
-- ============================================

-- 1. เพิ่มคอลัมน์ในตาราง leaves สำหรับผู้ปฏิบัติหน้าที่แทน
ALTER TABLE leaves 
ADD COLUMN acting_person_id UUID REFERENCES users(id), -- ผู้ที่ถูกเลือกให้ทำหน้าที่แทน
ADD COLUMN acting_status VARCHAR(20) DEFAULT 'pending', -- pending, approved, not_required
ADD COLUMN acting_approved_at TIMESTAMP WITH TIME ZONE, -- วันที่ผู้แทนอนุมัติ
ADD COLUMN acting_comment TEXT; -- ความเห็นของผู้แทน (ถ้ามี)

-- 2. สร้างตาราง notifications สำหรับการแจ้งเตือน
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL, -- ผู้รับการแจ้งเตือน
    type VARCHAR(50) NOT NULL, -- acting_request, leave_approved, leave_rejected, etc.
    title VARCHAR(200) NOT NULL, -- หัวข้อการแจ้งเตือน
    message TEXT NOT NULL, -- ข้อความ
    reference_id UUID, -- อ้างอิง (leave_id หรือ id อื่นๆ)
    reference_type VARCHAR(50), -- leave, approval, etc.
    is_read BOOLEAN DEFAULT false, -- อ่านแล้วหรือยัง
    action_url TEXT, -- URL สำหรับดำเนินการ (ถ้ามี)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE -- วันที่อ่าน
);

-- 3. สร้าง index สำหรับ notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- 4. สร้าง index สำหรับ acting_person_id
CREATE INDEX idx_leaves_acting_person_id ON leaves(acting_person_id);
CREATE INDEX idx_leaves_acting_status ON leaves(acting_status);

-- 5. เพิ่ม comment สำหรับคอลัมน์ใหม่
COMMENT ON COLUMN leaves.acting_person_id IS 'ผู้ที่ถูกเลือกให้ปฏิบัติหน้าที่แทนระหว่างลา (ต้องอยู่ชั้นเดียวกัน)';
COMMENT ON COLUMN leaves.acting_status IS 'สถานะการอนุมัติของผู้แทน: pending=รอการยอมรับ, approved=ยอมรับแล้ว, not_required=ไม่จำเป็นต้องมีผู้แทน';
COMMENT ON TABLE notifications IS 'ตารางเก็บการแจ้งเตือนทั้งหมดในระบบ';

-- ============================================
-- สร้าง Function สำหรับสร้าง Notification อัตโนมัติ
-- ============================================
CREATE OR REPLACE FUNCTION create_acting_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- ถ้ามีการเลือกผู้ปฏิบัติหน้าที่แทน
    IF NEW.acting_person_id IS NOT NULL AND NEW.acting_status = 'pending' THEN
        INSERT INTO notifications (
            user_id, 
            type, 
            title, 
            message, 
            reference_id, 
            reference_type,
            action_url
        )
        SELECT 
            NEW.acting_person_id,
            'acting_request',
            'คำขอให้ปฏิบัติหน้าที่แทน',
            CONCAT(
                u.first_name, ' ', u.last_name, 
                ' ขอให้คุณปฏิบัติหน้าที่แทนระหว่างวันที่ ', 
                TO_CHAR(NEW.start_date, 'DD/MM/YYYY'), 
                ' ถึง ', 
                TO_CHAR(NEW.end_date, 'DD/MM/YYYY')
            ),
            NEW.id,
            'leave',
            '/acting-requests'
        FROM users u
        WHERE u.id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. สร้าง Trigger เมื่อมีการสร้างหรืออัปเดตคำขอลา
DROP TRIGGER IF EXISTS trigger_create_acting_notification ON leaves;
CREATE TRIGGER trigger_create_acting_notification
    AFTER INSERT OR UPDATE OF acting_person_id, acting_status
    ON leaves
    FOR EACH ROW
    EXECUTE FUNCTION create_acting_notification();

-- ============================================
-- สร้าง View สำหรับดูข้อมูลการแจ้งเตือนพร้อมรายละเอียด
-- ============================================
CREATE OR REPLACE VIEW notifications_detail AS
SELECT 
    n.id,
    n.user_id,
    n.type,
    n.title,
    n.message,
    n.reference_id,
    n.reference_type,
    n.is_read,
    n.action_url,
    n.created_at,
    n.read_at,
    -- ข้อมูลผู้รับ
    u.employee_code as recipient_code,
    u.first_name as recipient_first_name,
    u.last_name as recipient_last_name,
    -- ข้อมูลการลา (ถ้ามี)
    l.leave_number,
    l.status as leave_status,
    l.start_date,
    l.end_date,
    -- ข้อมูลผู้ขอลา
    requester.employee_code as requester_code,
    requester.first_name as requester_first_name,
    requester.last_name as requester_last_name
FROM notifications n
LEFT JOIN users u ON n.user_id = u.id
LEFT JOIN leaves l ON n.reference_id = l.id AND n.reference_type = 'leave'
LEFT JOIN users requester ON l.user_id = requester.id;

-- ============================================
-- สร้าง Function สำหรับอนุมัติการเป็นผู้ปฏิบัติหน้าที่แทน
-- ============================================
CREATE OR REPLACE FUNCTION approve_acting_person(
    p_leave_id UUID,
    p_acting_person_id UUID,
    p_comment TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
    v_leave_user_id UUID;
    v_leave_number VARCHAR(50);
BEGIN
    -- ตรวจสอบว่ามีคำขอลาอยู่จริง
    SELECT user_id, leave_number INTO v_leave_user_id, v_leave_number
    FROM leaves 
    WHERE id = p_leave_id AND acting_person_id = p_acting_person_id AND acting_status = 'pending';
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'ไม่พบคำขอหรือคุณไม่ใช่ผู้ที่ถูกเลือกให้ทำหน้าที่แทน'
        );
    END IF;
    
    -- อัปเดตสถานะการอนุมัติ
    UPDATE leaves
    SET 
        acting_status = 'approved',
        acting_approved_at = NOW(),
        acting_comment = p_comment,
        updated_at = NOW()
    WHERE id = p_leave_id;
    
    -- สร้างการแจ้งเตือนกลับไปหาผู้ขอลา
    INSERT INTO notifications (
        user_id, 
        type, 
        title, 
        message, 
        reference_id, 
        reference_type,
        action_url
    )
    SELECT 
        v_leave_user_id,
        'acting_approved',
        'ผู้ปฏิบัติหน้าที่แทนยอมรับแล้ว',
        CONCAT(
            u.first_name, ' ', u.last_name, 
            ' ยอมรับที่จะปฏิบัติหน้าที่แทนคุณ สำหรับการลาเลขที่ ', 
            v_leave_number
        ),
        p_leave_id,
        'leave',
        '/my-leaves'
    FROM users u
    WHERE u.id = p_acting_person_id;
    
    -- บันทึกประวัติ
    INSERT INTO leave_history (user_id, leave_id, action, action_by, remarks)
    VALUES (v_leave_user_id, p_leave_id, 'acting_approved', p_acting_person_id, p_comment);
    
    RETURN json_build_object(
        'success', true,
        'message', 'ยอมรับการปฏิบัติหน้าที่แทนเรียบร้อยแล้ว'
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION approve_acting_person IS 'Function สำหรับผู้ที่ถูกเลือกให้ปฏิบัติหน้าที่แทนกดยอมรับ';
