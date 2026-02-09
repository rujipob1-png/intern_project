/**
 * Audit Log Service
 * บริการบันทึก audit trail สำหรับการดำเนินการสำคัญ
 */

import { supabaseAdmin } from '../config/supabase.js';

/**
 * Action types for audit logging
 */
export const AuditActions = {
  // Authentication
  LOGIN: 'login',
  LOGOUT: 'logout',
  PASSWORD_CHANGE: 'password_change',
  
  // Leave requests
  CREATE_LEAVE: 'create_leave',
  UPDATE_LEAVE: 'update_leave',
  CANCEL_LEAVE: 'cancel_leave',
  
  // Approvals
  APPROVE_LEAVE_LEVEL1: 'approve_leave_level1',
  APPROVE_LEAVE_LEVEL2: 'approve_leave_level2',
  APPROVE_LEAVE_LEVEL3: 'approve_leave_level3',
  APPROVE_LEAVE_FINAL: 'approve_leave_final',
  REJECT_LEAVE: 'reject_leave',
  PARTIAL_APPROVE_LEAVE: 'partial_approve_leave',
  
  // Cancel requests
  APPROVE_CANCEL: 'approve_cancel',
  REJECT_CANCEL: 'reject_cancel',
  
  // User management
  CREATE_USER: 'create_user',
  UPDATE_USER: 'update_user',
  DEACTIVATE_USER: 'deactivate_user',
  RESET_PASSWORD: 'reset_password',
  
  // Admin actions
  EXPORT_REPORT: 'export_report',
  SYSTEM_CONFIG: 'system_config'
};

/**
 * Entity types
 */
export const EntityTypes = {
  LEAVE: 'leave',
  USER: 'user',
  APPROVAL: 'approval',
  NOTIFICATION: 'notification',
  SYSTEM: 'system'
};

/**
 * Log an audit event
 * @param {Object} options - Audit log options
 * @param {string} options.userId - User ID who performed the action
 * @param {string} options.action - Action type (from AuditActions)
 * @param {string} options.entityType - Entity type (from EntityTypes)
 * @param {string} [options.entityId] - ID of the affected entity
 * @param {Object} [options.oldData] - Previous state
 * @param {Object} [options.newData] - New state
 * @param {string} [options.ipAddress] - Client IP address
 * @param {string} [options.userAgent] - Client user agent
 * @param {Object} [options.metadata] - Additional metadata
 * @returns {Promise<Object|null>} - Inserted log or null on error
 */
export async function createAuditLog({
  userId,
  action,
  entityType,
  entityId = null,
  oldData = null,
  newData = null,
  ipAddress = null,
  userAgent = null,
  metadata = null
}) {
  try {
    // Sanitize sensitive data before logging
    const sanitizedOldData = sanitizeData(oldData);
    const sanitizedNewData = sanitizeData(newData);
    
    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: userId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        old_data: sanitizedOldData,
        new_data: sanitizedNewData,
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata
      })
      .select()
      .single();
    
    if (error) {
      console.error('Audit log insert error:', error.message);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Audit log error:', error.message);
    return null;
  }
}

/**
 * Sanitize sensitive data before logging
 * @param {Object} data - Data to sanitize
 * @returns {Object|null} - Sanitized data
 */
function sanitizeData(data) {
  if (!data) return null;
  
  const sensitiveFields = [
    'password',
    'password_hash',
    'token',
    'access_token',
    'refresh_token',
    'secret',
    'api_key'
  ];
  
  const sanitized = { ...data };
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

/**
 * Get audit logs with filters
 * @param {Object} filters - Query filters
 * @param {number} [limit=50] - Number of records
 * @param {number} [offset=0] - Offset for pagination
 * @returns {Promise<Object>} - Audit logs with pagination info
 */
export async function getAuditLogs(filters = {}, limit = 50, offset = 0) {
  try {
    let query = supabaseAdmin
      .from('audit_logs')
      .select(`
        *,
        users:user_id (
          employee_code,
          first_name,
          last_name
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters.action) {
      query = query.eq('action', filters.action);
    }
    if (filters.entityType) {
      query = query.eq('entity_type', filters.entityType);
    }
    if (filters.entityId) {
      query = query.eq('entity_id', filters.entityId);
    }
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }
    
    // Pagination
    query = query.range(offset, offset + limit - 1);
    
    const { data, error, count } = await query;
    
    if (error) {
      throw error;
    }
    
    return {
      data,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: offset + limit < count
      }
    };
  } catch (error) {
    console.error('Get audit logs error:', error.message);
    return { data: [], pagination: { total: 0, limit, offset, hasMore: false } };
  }
}

/**
 * Middleware to extract request metadata for audit logging
 */
export function getRequestMetadata(req) {
  return {
    ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
    userAgent: req.headers['user-agent'] || 'Unknown'
  };
}

/**
 * Log leave action helper
 */
export async function logLeaveAction(req, action, leaveId, oldData = null, newData = null) {
  const { ipAddress, userAgent } = getRequestMetadata(req);
  
  return createAuditLog({
    userId: req.user?.id,
    action,
    entityType: EntityTypes.LEAVE,
    entityId: leaveId,
    oldData,
    newData,
    ipAddress,
    userAgent
  });
}

/**
 * Log user action helper
 */
export async function logUserAction(req, action, targetUserId, oldData = null, newData = null) {
  const { ipAddress, userAgent } = getRequestMetadata(req);
  
  return createAuditLog({
    userId: req.user?.id,
    action,
    entityType: EntityTypes.USER,
    entityId: targetUserId,
    oldData,
    newData,
    ipAddress,
    userAgent
  });
}

/**
 * Log login action helper
 */
export async function logLoginAction(userId, ipAddress, userAgent, success = true) {
  return createAuditLog({
    userId,
    action: AuditActions.LOGIN,
    entityType: EntityTypes.USER,
    entityId: userId,
    newData: { success },
    ipAddress,
    userAgent,
    metadata: { success }
  });
}

export default {
  AuditActions,
  EntityTypes,
  createAuditLog,
  getAuditLogs,
  logLeaveAction,
  logUserAction,
  logLoginAction,
  getRequestMetadata
};
