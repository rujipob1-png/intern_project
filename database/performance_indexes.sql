-- Performance Indexes for Leave Request System
-- Run these to improve query performance

-- ==================== Users Table ====================
-- Index for role lookups (frequent queries)
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);

-- Index for department queries (director sees own department)
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);

-- Index for employee code lookups (login)
CREATE INDEX IF NOT EXISTS idx_users_employee_code ON users(employee_code);

-- Index for active users
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active) WHERE is_active = true;

-- Composite index for department + role queries
CREATE INDEX IF NOT EXISTS idx_users_dept_role ON users(department, role_id);

-- ==================== Leaves Table ====================
-- Index for status queries (pending leaves, etc.)
CREATE INDEX IF NOT EXISTS idx_leaves_status ON leaves(status);

-- Index for user's leaves
CREATE INDEX IF NOT EXISTS idx_leaves_user_id ON leaves(user_id);

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_leaves_date_range ON leaves(start_date, end_date);

-- Composite index for status + user (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_leaves_status_user ON leaves(status, user_id);

-- Composite index for approval workflow
CREATE INDEX IF NOT EXISTS idx_leaves_status_level ON leaves(status, current_approval_level);

-- Index for leave type filtering
CREATE INDEX IF NOT EXISTS idx_leaves_type ON leaves(leave_type_id);

-- Index for created_at (history, reports sorted by date)
CREATE INDEX IF NOT EXISTS idx_leaves_created_at ON leaves(created_at DESC);

-- ==================== Approvals Table ====================
-- Index for leave approvals lookup
CREATE INDEX IF NOT EXISTS idx_approvals_leave_id ON approvals(leave_id);

-- Index for approver history
CREATE INDEX IF NOT EXISTS idx_approvals_approver ON approvals(approver_id);

-- Index for approval level queries
CREATE INDEX IF NOT EXISTS idx_approvals_level ON approvals(approval_level);

-- Composite for leave + level (get specific level approval)
CREATE INDEX IF NOT EXISTS idx_approvals_leave_level ON approvals(leave_id, approval_level);

-- ==================== Notifications Table ====================
-- Index for user notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- Index for unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read) WHERE is_read = false;

-- Index for recent notifications
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- ==================== Audit Logs Table ====================
-- These are already created in create_audit_logs_table.sql but listing for completeness
-- CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
-- CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
-- CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
-- CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ==================== Leave Types Table ====================
-- Index for type code lookups
CREATE INDEX IF NOT EXISTS idx_leave_types_code ON leave_types(type_code);

-- ==================== Statistics Query ====================
-- View for quick statistics (can be materialized for large datasets)
CREATE OR REPLACE VIEW leave_statistics AS
SELECT 
    DATE_TRUNC('month', start_date) as month,
    leave_type_id,
    status,
    COUNT(*) as count,
    SUM(total_days) as total_days
FROM leaves
GROUP BY DATE_TRUNC('month', start_date), leave_type_id, status;

-- ==================== Analyze Tables ====================
-- Run ANALYZE to update statistics for query planner
ANALYZE users;
ANALYZE leaves;
ANALYZE approvals;
ANALYZE notifications;
ANALYZE leave_types;

-- ==================== Notes ====================
-- 1. After creating indexes, run ANALYZE to update table statistics
-- 2. Monitor query performance using EXPLAIN ANALYZE
-- 3. Consider partial indexes for specific query patterns
-- 4. For very large tables, consider table partitioning by date
-- 5. Regularly run VACUUM ANALYZE for optimal performance
