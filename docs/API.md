# 📚 API Documentation

## Overview

ระบบการลาออนไลน์ API ใช้ REST architecture พร้อม JWT authentication

**Base URL:** `http://localhost:3000/api`

**Interactive Docs:** `http://localhost:3000/api-docs` (Swagger UI)

---

## 🔐 Authentication

ทุก protected endpoint ต้องส่ง JWT token ใน header:

```
Authorization: Bearer <token>
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "employee_code": "51143",
  "password": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "เข้าสู่ระบบสำเร็จ",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "employee_code": "51143",
      "first_name": "สมชาย",
      "last_name": "ใจดี",
      "role_name": "user"
    }
  }
}
```

---

## 📋 Leaves API (User)

### Get Leave Types
```http
GET /leaves/types
Authorization: Bearer <token>
```

### Get Leave Balance
```http
GET /leaves/balance
Authorization: Bearer <token>
```

### Create Leave Request
```http
POST /leaves
Authorization: Bearer <token>
Content-Type: application/json

{
  "leaveTypeId": 1,
  "selectedDates": ["2026-01-15", "2026-01-16"],
  "reason": "ลาป่วยไข้หวัด",
  "actingPersonId": 2,
  "contactPhone": "0812345678"
}
```

### Get My Leaves
```http
GET /leaves
Authorization: Bearer <token>
```

### Get Leave Detail
```http
GET /leaves/:id
Authorization: Bearer <token>
```

### Request Cancel Leave
```http
PUT /leaves/:id/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "cancelReason": "เหตุผลในการยกเลิก"
}
```

---

## 👔 Director API

### Get Pending Leaves
```http
GET /director/leaves/pending
Authorization: Bearer <token>
```

### Approve Leave
```http
POST /director/leaves/:id/approve
Authorization: Bearer <token>
Content-Type: application/json

{
  "comment": "อนุมัติ"
}
```

### Reject Leave
```http
POST /director/leaves/:id/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "comment": "ไม่อนุมัติเนื่องจาก..."
}
```

---

## 🏢 Central Office API

### Staff - Get Pending
```http
GET /central-office/staff/pending
Authorization: Bearer <token>
```

### Staff - Approve/Reject
```http
POST /central-office/staff/:id/approve
POST /central-office/staff/:id/reject
Authorization: Bearer <token>
```

### Head - Get Pending
```http
GET /central-office/head/pending
Authorization: Bearer <token>
```

### Head - Approve/Reject
```http
POST /central-office/head/:id/approve
POST /central-office/head/:id/reject
Authorization: Bearer <token>
```

---

## 👑 Admin API

### Get Pending Leaves (Final Level)
```http
GET /admin/leaves/pending
Authorization: Bearer <token>
```

### Final Approve
```http
PUT /admin/leaves/:id/approve
Authorization: Bearer <token>
```

### Partial Approve
```http
PUT /admin/leaves/:id/partial-approve
Authorization: Bearer <token>
Content-Type: application/json

{
  "approvedDates": ["2026-01-15"],
  "comment": "อนุมัติบางวัน"
}
```

### Get All Users
```http
GET /admin/users
Authorization: Bearer <token>
```

### Update User
```http
PUT /admin/users/:id
Authorization: Bearer <token>
```

---

## 🔔 Notifications API

### Get Notifications
```http
GET /notifications
Authorization: Bearer <token>
```

### Get Unread Count
```http
GET /notifications/unread-count
Authorization: Bearer <token>
```

### Mark as Read
```http
PUT /notifications/:id/read
Authorization: Bearer <token>
```

### Mark All as Read
```http
PUT /notifications/mark-all-read
Authorization: Bearer <token>
```

---

## 📊 Status Codes

| Code | Description |
|------|-------------|
| 200 | สำเร็จ |
| 201 | สร้างสำเร็จ |
| 400 | ข้อมูลไม่ถูกต้อง |
| 401 | ไม่ได้เข้าสู่ระบบ |
| 403 | ไม่มีสิทธิ์เข้าถึง |
| 404 | ไม่พบข้อมูล |
| 429 | Request มากเกินไป (Rate Limit) |
| 500 | Server Error |

---

## 🛡️ Rate Limiting

| Endpoint | Limit |
|----------|-------|
| `/auth/login` | 5 ครั้ง / 15 นาที |
| `/auth/change-password` | 3 ครั้ง / ชั่วโมง |
| `POST /leaves` | 30 ครั้ง / นาที |
| Other API | 100 ครั้ง / นาที |

---

## 📝 Leave Statuses

| Status | Description |
|--------|-------------|
| `pending` | รอพิจารณา (Level 1) |
| `approved_level_1` | ผอ.อนุมัติแล้ว |
| `approved_level_2` | เจ้าหน้าที่ส่วนกลางอนุมัติแล้ว |
| `approved_level_3` | หัวหน้าส่วนกลางอนุมัติแล้ว |
| `approved_final` | อนุมัติขั้นสุดท้าย ✅ |
| `rejected` | ถูกปฏิเสธ ❌ |
| `cancelled` | ถูกยกเลิก |
| `pending_cancel` | รอการอนุมัติยกเลิก |

---

## 🔧 Error Response Format

```json
{
  "success": false,
  "message": "Error message in Thai",
  "errorCode": "ERROR_CODE",
  "errors": [
    {
      "field": "fieldName",
      "message": "Field error message"
    }
  ]
}
```
