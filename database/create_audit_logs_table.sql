-- Create audit_logs table for tracking important actions
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'leave', 'user', 'approval', etc.
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Add RLS policies
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admin can read audit logs
CREATE POLICY "Admin can read audit logs" ON audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = auth.uid() AND r.role_name = 'admin'
        )
    );

-- Service role can insert (via backend)
CREATE POLICY "Service role can insert audit logs" ON audit_logs
    FOR INSERT
    WITH CHECK (true);

COMMENT ON TABLE audit_logs IS 'Audit trail for important system actions';
COMMENT ON COLUMN audit_logs.action IS 'Action type: login, logout, create_leave, approve_leave, reject_leave, update_user, etc.';
COMMENT ON COLUMN audit_logs.entity_type IS 'Type of entity: leave, user, approval, notification';
COMMENT ON COLUMN audit_logs.old_data IS 'Previous state before change (for update/delete)';
COMMENT ON COLUMN audit_logs.new_data IS 'New state after change (for create/update)';
