/**
 * Logger Configuration using Winston
 * สำหรับ logging แบบมีระดับและ format ที่ดี
 */

import winston from 'winston';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

// Add colors to winston
winston.addColors(colors);

// Get environment
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// Define formats
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define transports
const transports = [];

// Console transport (always enabled except in test)
if (!isTest) {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: isDevelopment ? 'debug' : 'info'
    })
  );
}

// File transports (only in production)
if (!isDevelopment && !isTest) {
  // All logs
  transports.push(
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      format: fileFormat,
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
  
  // Error logs only
  transports.push(
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      format: fileFormat,
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: isDevelopment ? 'debug' : 'info',
  levels,
  transports
});

// HTTP request logging middleware
export const httpLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl } = req;
    const { statusCode } = res;
    
    // Skip health check endpoints
    if (originalUrl === '/api/health') {
      return;
    }
    
    const message = `${method} ${originalUrl} ${statusCode} ${duration}ms`;
    
    if (statusCode >= 500) {
      logger.error(message, { 
        method, 
        url: originalUrl, 
        statusCode, 
        duration,
        userId: req.user?.id
      });
    } else if (statusCode >= 400) {
      logger.warn(message, { 
        method, 
        url: originalUrl, 
        statusCode, 
        duration 
      });
    } else {
      logger.http(message, { 
        method, 
        url: originalUrl, 
        statusCode, 
        duration 
      });
    }
  });
  
  next();
};

// Error logging helper
export const logError = (error, context = {}) => {
  logger.error(error.message, {
    stack: error.stack,
    name: error.name,
    ...context
  });
};

// Audit action logging
export const logAuditAction = (action, userId, details = {}) => {
  logger.info(`Audit: ${action}`, {
    action,
    userId,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Security event logging
export const logSecurityEvent = (event, details = {}) => {
  logger.warn(`Security: ${event}`, {
    event,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Performance logging
export const logPerformance = (operation, duration, details = {}) => {
  if (duration > 1000) {
    logger.warn(`Slow operation: ${operation}`, {
      operation,
      duration: `${duration}ms`,
      ...details
    });
  } else {
    logger.debug(`Performance: ${operation}`, {
      operation,
      duration: `${duration}ms`,
      ...details
    });
  }
};

export { logger };
export default logger;
