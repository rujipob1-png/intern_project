/**
 * ============================================
 * Validation Utils Tests
 * ทดสอบ validation schemas และ functions
 * ============================================
 */

import { describe, it, expect } from 'vitest';
import { 
  loginSchema, 
  leaveRequestSchema, 
  sanitizeString, 
  sanitizeObject,
  validateData,
  validators
} from '../utils/validation';

describe('sanitizeString', () => {
  it('should remove HTML tags', () => {
    expect(sanitizeString('<script>alert("xss")</script>')).toBe('alert("xss")');
    expect(sanitizeString('<div>Hello</div>')).toBe('Hello');
    expect(sanitizeString('<b>Bold</b> text')).toBe('Bold text');
  });

  it('should remove javascript: protocol', () => {
    expect(sanitizeString('javascript:alert(1)')).toBe('alert(1)');
    expect(sanitizeString('JAVASCRIPT:evil()')).toBe('evil()');
  });

  it('should remove event handlers', () => {
    expect(sanitizeString('onclick=alert(1)')).toBe('alert(1)');
    expect(sanitizeString('onmouseover=hack()')).toBe('hack()');
  });

  it('should trim whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
    expect(sanitizeString('\n\ttest  ')).toBe('test');
  });

  it('should handle non-string values', () => {
    expect(sanitizeString(123)).toBe(123);
    expect(sanitizeString(null)).toBe(null);
    expect(sanitizeString(undefined)).toBe(undefined);
  });
});

describe('sanitizeObject', () => {
  it('should sanitize all string values in object', () => {
    const input = {
      name: '<script>bad</script>John',
      age: 25,
      nested: {
        value: '<div>test</div>'
      }
    };
    
    const result = sanitizeObject(input);
    
    expect(result.name).toBe('badJohn');
    expect(result.age).toBe(25);
    expect(result.nested.value).toBe('test');
  });

  it('should sanitize arrays', () => {
    const input = ['<b>one</b>', '<i>two</i>', 'three'];
    const result = sanitizeObject(input);
    
    expect(result).toEqual(['one', 'two', 'three']);
  });
});

describe('loginSchema', () => {
  it('should validate valid login data', () => {
    const result = validateData(loginSchema, {
      employeeCode: '51143',
      password: '123456'
    });
    
    expect(result.success).toBe(true);
    expect(result.data.employeeCode).toBe('51143');
  });

  it('should fail for empty employee code', () => {
    const result = validateData(loginSchema, {
      employeeCode: '',
      password: '123456'
    });
    
    expect(result.success).toBe(false);
    expect(Object.keys(result.errors).length).toBeGreaterThan(0);
  });

  it('should fail for short password', () => {
    const result = validateData(loginSchema, {
      employeeCode: '51143',
      password: '123'
    });
    
    expect(result.success).toBe(false);
    expect(Object.keys(result.errors).length).toBeGreaterThan(0);
  });

  it('should fail for invalid employee code characters', () => {
    const result = validateData(loginSchema, {
      employeeCode: '51143!@#',
      password: '123456'
    });
    
    expect(result.success).toBe(false);
  });

  it('should uppercase employee code', () => {
    const result = validateData(loginSchema, {
      employeeCode: 'abc123',
      password: '123456'
    });
    
    expect(result.success).toBe(true);
    expect(result.data.employeeCode).toBe('ABC123');
  });
});

describe('leaveRequestSchema', () => {
  it('should validate valid leave request', () => {
    const result = validateData(leaveRequestSchema, {
      leaveTypeId: 1,
      startDate: '2026-01-15',
      endDate: '2026-01-16',
      reason: 'ลาป่วยเพราะไม่สบาย',
      selectedDates: ['2026-01-15', '2026-01-16']
    });
    
    expect(result.success).toBe(true);
  });

  it('should fail for missing leave type', () => {
    const result = validateData(leaveRequestSchema, {
      startDate: '2026-01-15',
      endDate: '2026-01-16',
      reason: 'Test reason',
      selectedDates: ['2026-01-15']
    });
    
    expect(result.success).toBe(false);
  });

  it('should fail for empty selected dates', () => {
    const result = validateData(leaveRequestSchema, {
      leaveTypeId: 1,
      startDate: '2026-01-15',
      endDate: '2026-01-16',
      reason: 'Test reason',
      selectedDates: []
    });
    
    expect(result.success).toBe(false);
  });

  it('should fail for short reason', () => {
    const result = validateData(leaveRequestSchema, {
      leaveTypeId: 1,
      startDate: '2026-01-15',
      endDate: '2026-01-16',
      reason: 'ลา',
      selectedDates: ['2026-01-15']
    });
    
    expect(result.success).toBe(false);
  });

  it('should sanitize reason from XSS', () => {
    const result = validateData(leaveRequestSchema, {
      leaveTypeId: 1,
      startDate: '2026-01-15',
      endDate: '2026-01-16',
      reason: '<script>alert("xss")</script>ลาป่วย',
      selectedDates: ['2026-01-15']
    });
    
    expect(result.success).toBe(true);
    expect(result.data.reason).not.toContain('<script>');
  });

  it('should fail when end date is before start date', () => {
    const result = validateData(leaveRequestSchema, {
      leaveTypeId: 1,
      startDate: '2026-01-16',
      endDate: '2026-01-15',
      reason: 'Test reason here',
      selectedDates: ['2026-01-15']
    });
    
    expect(result.success).toBe(false);
  });
});

describe('validators', () => {
  describe('required', () => {
    it('should return error for empty value', () => {
      expect(validators.required('')).toBe('กรุณากรอกข้อมูล');
      expect(validators.required('   ')).toBe('กรุณากรอกข้อมูล');
      expect(validators.required(null)).toBe('กรุณากรอกข้อมูล');
    });

    it('should return null for valid value', () => {
      expect(validators.required('test')).toBeNull();
      expect(validators.required('  test  ')).toBeNull();
    });
  });

  describe('phone', () => {
    it('should return error for invalid phone', () => {
      expect(validators.phone('abc123')).toBeDefined();
      expect(validators.phone('08-1234-abcd')).toBeDefined();
    });

    it('should return null for valid phone', () => {
      expect(validators.phone('0812345678')).toBeNull();
      expect(validators.phone('081-234-5678')).toBeNull();
      expect(validators.phone('+66812345678')).toBeNull();
    });
  });

  describe('email', () => {
    it('should return error for invalid email', () => {
      expect(validators.email('invalid')).toBeDefined();
      expect(validators.email('test@')).toBeDefined();
      expect(validators.email('@test.com')).toBeDefined();
    });

    it('should return null for valid email', () => {
      expect(validators.email('test@example.com')).toBeNull();
      expect(validators.email('user.name@domain.co.th')).toBeNull();
    });
  });
});
