import { errorResponse } from '../utils/response.js';
import { HTTP_STATUS, ROLE_LEVELS } from '../config/constants.js';

/**
 * Middleware สำหรับตรวจสอบ Role
 * @param {Array} allowedRoles - Array ของ role names ที่อนุญาต เช่น ['user', 'director']
 */
export const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        'Authentication required'
      );
    }

    const userRole = req.user.roleName;

    // ถ้าไม่ระบุ allowedRoles หรือ user มี role ที่อนุญาต
    if (allowedRoles.length === 0 || allowedRoles.includes(userRole)) {
      return next();
    }

    return errorResponse(
      res,
      HTTP_STATUS.FORBIDDEN,
      'You do not have permission to access this resource'
    );
  };
};

// Backward compatibility
export const authorize = requireRole;

/**
 * Middleware สำหรับตรวจสอบระดับ Role (level)
 * @param {Number} minLevel - ระดับขั้นต่ำที่อนุญาต (1-4)
 */
export const authorizeLevel = (minLevel) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        'Authentication required'
      );
    }

    const userLevel = req.user.roleLevel;

    if (userLevel >= minLevel) {
      return next();
    }

    return errorResponse(
      res,
      HTTP_STATUS.FORBIDDEN,
      'Your role level is insufficient to access this resource'
    );
  };
};

/**
 * Middleware สำหรับตรวจสอบว่าเป็น User ทั่วไปเท่านั้น
 */
export const userOnly = requireRole(['user']);

/**
 * Middleware สำหรับตรวจสอบว่าเป็น Director ขึ้นไป
 */
export const directorAndAbove = authorizeLevel(2);

/**
 * Middleware สำหรับตรวจสอบว่าเป็น Central Office Staff ขึ้นไป
 */
export const centralOfficeAndAbove = authorizeLevel(3);

/**
 * Middleware สำหรับตรวจสอบว่าเป็น Central Office Head ขึ้นไป
 */
export const centralOfficeHeadAndAbove = authorizeLevel(4);

/**
 * Middleware สำหรับตรวจสอบว่าเป็น Admin เท่านั้น
 */
export const adminOnly = requireRole(['admin']);
