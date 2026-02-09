/**
 * ============================================
 * Security Middleware Tests
 * ทดสอบ rate limiting, CSRF, sanitization
 * ============================================
 */

import { jest } from '@jest/globals';
import { sanitizeString } from '../src/middlewares/security.middleware.js';

describe('Security Middleware', () => {
  describe('sanitizeString', () => {
    test('should remove HTML tags', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe('alert("xss")');
      expect(sanitizeString('<div>Hello</div>')).toBe('Hello');
    });

    test('should remove javascript: protocol', () => {
      expect(sanitizeString('javascript:alert(1)')).toBe('alert(1)');
    });

    test('should remove event handlers', () => {
      expect(sanitizeString('onclick=alert(1)')).toBe('alert(1)');
    });

    test('should trim whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });

    test('should handle non-string values', () => {
      expect(sanitizeString(123)).toBe(123);
      expect(sanitizeString(null)).toBe(null);
    });
  });
});
