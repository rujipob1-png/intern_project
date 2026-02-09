/**
 * ============================================
 * Swagger Configuration
 * API Documentation Setup
 * ============================================
 */

import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ระบบการลาออนไลน์ API',
      version: '1.0.0',
      description: `
        API สำหรับระบบจัดการการลาออนไลน์
        
        ## Features
        - ระบบ Authentication (JWT)
        - จัดการใบลา (สร้าง, ดู, ยกเลิก)
        - ระบบอนุมัติ 4 ขั้น
        - Notifications
        - Reports
        
        ## Roles
        - **user**: พนักงานทั่วไป
        - **director**: ผู้อำนวยการกลุ่มงาน
        - **central_office_staff**: เจ้าหน้าที่ส่วนกลาง
        - **central_office_head**: หัวหน้าส่วนกลาง
        - **admin**: ผู้ดูแลระบบ
      `,
      contact: {
        name: 'IT Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'ใส่ JWT token ที่ได้จาก /auth/login'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            employee_code: { type: 'string', example: '51143' },
            title: { type: 'string', example: 'นาย' },
            first_name: { type: 'string', example: 'สมชาย' },
            last_name: { type: 'string', example: 'ใจดี' },
            position: { type: 'string', example: 'เจ้าหน้าที่ IT' },
            department: { type: 'string', example: 'GTS' },
            phone: { type: 'string', example: '0812345678' },
            role_id: { type: 'integer', example: 1 }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['employee_code', 'password'],
          properties: {
            employee_code: { type: 'string', example: '51143' },
            password: { type: 'string', example: '123456' }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'เข้าสู่ระบบสำเร็จ' },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5...' },
                user: { $ref: '#/components/schemas/User' }
              }
            }
          }
        },
        LeaveType: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            type_code: { type: 'string', example: 'SICK' },
            type_name: { type: 'string', example: 'ลาป่วย' },
            max_days_per_year: { type: 'integer', example: 60 }
          }
        },
        LeaveRequest: {
          type: 'object',
          required: ['leaveTypeId', 'selectedDates', 'reason'],
          properties: {
            leaveTypeId: { type: 'integer', example: 1 },
            selectedDates: { 
              type: 'array', 
              items: { type: 'string' },
              example: ['2026-01-15', '2026-01-16'] 
            },
            reason: { type: 'string', example: 'ลาป่วยไข้หวัดใหญ่' },
            actingPersonId: { type: 'integer', example: 2, nullable: true },
            contactAddress: { type: 'string', example: '123 ถนนสุขุมวิท', nullable: true },
            contactPhone: { type: 'string', example: '0812345678', nullable: true }
          }
        },
        Leave: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            user_id: { type: 'integer', example: 1 },
            leave_type_id: { type: 'integer', example: 1 },
            start_date: { type: 'string', format: 'date', example: '2026-01-15' },
            end_date: { type: 'string', format: 'date', example: '2026-01-16' },
            total_days: { type: 'number', example: 2 },
            reason: { type: 'string', example: 'ลาป่วย' },
            status: { 
              type: 'string', 
              enum: ['pending', 'approved_level_1', 'approved_level_2', 'approved_level_3', 'approved_final', 'rejected', 'cancelled'],
              example: 'pending' 
            }
          }
        },
        LeaveBalance: {
          type: 'object',
          properties: {
            leave_type_id: { type: 'integer', example: 1 },
            type_code: { type: 'string', example: 'SICK' },
            type_name: { type: 'string', example: 'ลาป่วย' },
            max_days_per_year: { type: 'integer', example: 60 },
            used_days: { type: 'number', example: 5 },
            remaining_days: { type: 'number', example: 55 }
          }
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            user_id: { type: 'integer', example: 1 },
            title: { type: 'string', example: 'ใบลาได้รับการอนุมัติ' },
            message: { type: 'string', example: 'ใบลาของคุณได้รับการอนุมัติจาก ผอ.' },
            is_read: { type: 'boolean', example: false },
            created_at: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Leaves', description: 'Leave request management' },
      { name: 'Director', description: 'Director approval endpoints' },
      { name: 'Central Office', description: 'Central office approval endpoints' },
      { name: 'Admin', description: 'Admin endpoints' },
      { name: 'Notifications', description: 'Notification management' }
    ]
  },
  apis: ['./src/routes/*.js']
};

export const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
