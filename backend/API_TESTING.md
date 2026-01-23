# API Testing Guide - Leave Management System

## 🧪 วิธีทดสอบ APIs

คุณสามารถทดสอบได้หลายวิธี:
1. **Thunder Client** (VS Code Extension) - แนะนำ
2. **Postman**
3. **cURL** (Command line)
4. **REST Client** (VS Code Extension)

---

## 🔐 1. Authentication APIs

### 1.1 Login

**Endpoint:** `POST http://localhost:3000/api/auth/login`

**Request Body:**
```json
{
  "employeeCode": "EMP001",
  "password": "123456"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "employeeCode": "EMP001",
      "firstName": "สมชาย",
      "lastName": "ใจดี",
      "fullName": "นายสมชาย ใจดี",
      "position": "เจ้าพนักงานธุรการ",
      "department": "กองบริหารทั่วไป",
      "role": {
        "name": "user",
        "level": 1
      },
      "leaveBalance": {
        "sick": 30,
        "personal": 0,
        "vacation": 10
      }
    }
  }
}
```

**⚠️ สำคัญ:** เก็บ `token` ไว้ใช้กับ requests ต่อไป!

---

### 1.2 Get Profile

**Endpoint:** `GET http://localhost:3000/api/auth/profile`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

---

### 1.3 Change Password

**Endpoint:** `PUT http://localhost:3000/api/auth/change-password`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Request Body:**
```json
{
  "currentPassword": "123456",
  "newPassword": "newpassword123"
}
```

---

## 📝 2. Leave Management APIs (User Role)

**หมายเหตุ:** ต้อง login ก่อนและใส่ token ในทุก request!

### 2.1 Create Leave Request

**Endpoint:** `POST http://localhost:3000/api/leaves`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Request Body:**
```json
{
  "leaveTypeId": "GET_FROM_DATABASE",
  "startDate": "2026-02-01",
  "endDate": "2026-02-03",
  "totalDays": 3,
  "reason": "ป่วยเป็นไข้หวัด ต้องพักรักษาตัว",
  "contactAddress": "123 ถ.สุขุมวิท แขวงคลองเตย กรุงเทพฯ",
  "contactPhone": "081-234-5678"
}
```

**วิธีหา leaveTypeId:**
ไปที่ Supabase SQL Editor แล้ว run:
```sql
SELECT id, type_code, type_name FROM leave_types;
```
เลือก id ของประเภทที่ต้องการ

---

### 2.2 Get My Leaves (ดูรายการลาของตัวเอง)

**Endpoint:** `GET http://localhost:3000/api/leaves`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Query Parameters:**
- `page` (optional): หน้าที่ต้องการ (default: 1)
- `limit` (optional): จำนวนรายการต่อหน้า (default: 10)
- `status` (optional): กรองตามสถานะ (pending, approved_level1, etc.)

**ตัวอย่าง:**
```
GET http://localhost:3000/api/leaves?page=1&limit=10&status=pending
```

---

### 2.3 Get Leave Details

**Endpoint:** `GET http://localhost:3000/api/leaves/:id`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**ตัวอย่าง:**
```
GET http://localhost:3000/api/leaves/550e8400-e29b-41d4-a716-446655440000
```

---

### 2.4 Cancel Leave Request

**Endpoint:** `PUT http://localhost:3000/api/leaves/:id/cancel`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Request Body:**
```json
{
  "reason": "ธุระเสร็จก่อนกำหนด ไม่จำเป็นต้องลาแล้ว"
}
```

---

### 2.5 Get Leave Balance

**Endpoint:** `GET http://localhost:3000/api/leaves/balance`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

---

## 🧪 การทดสอบแบบ Step-by-Step

### ขั้นตอนที่ 1: Login
1. เปิด Thunder Client หรือ Postman
2. สร้าง request: `POST http://localhost:3000/api/auth/login`
3. ใส่ body:
```json
{
  "employeeCode": "EMP001",
  "password": "123456"
}
```
4. กด Send
5. **คัดลอก token** จาก response

### ขั้นตอนที่ 2: สร้างคำขอลา
1. สร้าง request: `POST http://localhost:3000/api/leaves`
2. เพิ่ม Header: `Authorization: Bearer YOUR_TOKEN`
3. หา leaveTypeId จาก Supabase:
   - ไปที่ SQL Editor
   - Run: `SELECT id FROM leave_types WHERE type_code = 'SICK';`
   - คัดลอก id
4. ใส่ body (ใส่ leaveTypeId ที่ได้):
```json
{
  "leaveTypeId": "YOUR_LEAVE_TYPE_ID",
  "startDate": "2026-02-01",
  "endDate": "2026-02-03",
  "totalDays": 3,
  "reason": "ป่วยเป็นไข้หวัด",
  "contactAddress": "123 ถนนสุขุมวิท กรุงเทพฯ",
  "contactPhone": "081-234-5678"
}
```
5. กด Send

### ขั้นตอนที่ 3: ดูรายการลา
1. สร้าง request: `GET http://localhost:3000/api/leaves`
2. เพิ่ม Header: `Authorization: Bearer YOUR_TOKEN`
3. กด Send
4. จะเห็นรายการลาที่สร้างไว้

### ขั้นตอนที่ 4: ดูรายละเอียดลา
1. คัดลอก `id` จากรายการลาที่ได้
2. สร้าง request: `GET http://localhost:3000/api/leaves/YOUR_LEAVE_ID`
3. เพิ่ม Header: `Authorization: Bearer YOUR_TOKEN`
4. กด Send

### ขั้นตอนที่ 5: ยกเลิกการลา
1. ใช้ `id` จากข้อ 4
2. สร้าง request: `PUT http://localhost:3000/api/leaves/YOUR_LEAVE_ID/cancel`
3. เพิ่ม Header: `Authorization: Bearer YOUR_TOKEN`
4. ใส่ body:
```json
{
  "reason": "ยกเลิกเพราะธุระเสร็จแล้ว"
}
```
5. กด Send

---

## 📋 Test Accounts

| Employee Code | Password | Role | ชื่อ |
|--------------|----------|------|------|
| EMP001 | 123456 | User | นายสมชาย ใจดี |
| EMP002 | 123456 | User | นางสาวสมหญิง รักงาน |
| DIR001 | 123456 | Director | นายวิชัย ผู้นำ |
| CTR001 | 123456 | Central Office | นางสุดา รอบคอบ |
| ADMIN001 | 123456 | Admin | นายประสิทธิ์ เด็ดขาด |

---

## 🐛 Error Codes และการแก้ไข

### 401 Unauthorized
- **สาเหตุ:** ไม่มี token หรือ token ไม่ถูกต้อง
- **แก้ไข:** Login ใหม่และใส่ token ที่ถูกต้อง

### 403 Forbidden
- **สาเหตุ:** ไม่มีสิทธิ์เข้าถึง
- **แก้ไข:** ตรวจสอบว่าใช้ user ที่มี role ถูกต้อง

### 404 Not Found
- **สาเหตุ:** ไม่พบข้อมูล
- **แก้ไข:** ตรวจสอบ ID ที่ส่งไป

### 400 Bad Request
- **สาเหตุ:** ข้อมูลไม่ครบหรือไม่ถูกต้อง
- **แก้ไข:** ตรวจสอบ request body

---

## ✅ Checklist การทดสอบ

### Authentication
- [ ] Login สำเร็จ (EMP001)
- [ ] Login ด้วยรหัสผ่านผิด (ต้อง error)
- [ ] Login ด้วย employee code ที่ไม่มี (ต้อง error)
- [ ] Get Profile สำเร็จ
- [ ] Get Profile โดยไม่ใส่ token (ต้อง error)
- [ ] Change Password สำเร็จ

### Leave Management
- [ ] สร้างคำขอลาสำเร็จ
- [ ] ดูรายการลาของตัวเอง
- [ ] ดูรายละเอียดลา 1 รายการ
- [ ] ยกเลิกคำขอลาสำเร็จ
- [ ] ยกเลิกคำขอลาที่ยกเลิกแล้ว (ต้อง error)
- [ ] ดูวันลาคงเหลือ

---

## 👔 3. Director APIs (Role 2)

**หมายเหตุ:** ต้อง login ด้วย DIR001 ก่อน!

### 3.1 ดูคำขอลาที่รออนุมัติ (Pending Leaves)

**Endpoint:** `GET http://localhost:3000/api/director/leaves/pending`

**Headers:**
```
Authorization: Bearer DIRECTOR_TOKEN
```

**Query Parameters:**
- `page` (optional): หน้าที่ต้องการ
- `limit` (optional): จำนวนรายการต่อหน้า
- `department` (optional): กรองตามแผนก

---

### 3.2 อนุมัติคำขอลา (Approve Level 1)

**Endpoint:** `PUT http://localhost:3000/api/director/leaves/:id/approve`

**Headers:**
```
Authorization: Bearer DIRECTOR_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "comment": "อนุมัติตามที่เสนอ"
}
```

---

### 3.3 ไม่อนุมัติคำขอลา (Reject)

**Endpoint:** `PUT http://localhost:3000/api/director/leaves/:id/reject`

**Headers:**
```
Authorization: Bearer DIRECTOR_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "comment": "วันที่ลามีงานสำคัญ กรุณาเลื่อนวันลา"
}
```

**⚠️ หมายเหตุ:** comment เป็น required!

---

### 3.4 ดูรายชื่อพนักงาน

**Endpoint:** `GET http://localhost:3000/api/director/employees`

**Headers:**
```
Authorization: Bearer DIRECTOR_TOKEN
```

**Query Parameters:**
- `page`, `limit`: การแบ่งหน้า
- `search`: ค้นหาชื่อ
- `department`: กรองตามแผนก
- `roleLevel`: กรองตาม role level

---

### 3.5 ดูข้อมูลพนักงาน 1 คน

**Endpoint:** `GET http://localhost:3000/api/director/employees/:id`

**Headers:**
```
Authorization: Bearer DIRECTOR_TOKEN
```

---

### 3.6 ดูประวัติการลาของพนักงาน

**Endpoint:** `GET http://localhost:3000/api/director/employees/:id/leaves`

**Headers:**
```
Authorization: Bearer DIRECTOR_TOKEN
```

---

## 🏢 4. Central Office APIs (Role 3)

**หมายเหตุ:** ต้อง login ด้วย CTR001 ก่อน!

### 4.1 ดูคำขอลาที่ Director อนุมัติแล้ว

**Endpoint:** `GET http://localhost:3000/api/central-office/leaves/pending`

**Headers:**
```
Authorization: Bearer CENTRAL_OFFICE_TOKEN
```

**Query Parameters:**
- `page`, `limit`: การแบ่งหน้า
- `department`: กรองตามแผนก

**Response:** คำขอลาที่มีสถานะ `approved_level1` และรอการอนุมัติระดับ 2

---

### 4.2 อนุมัติคำขอลาระดับ 2

**Endpoint:** `PUT http://localhost:3000/api/central-office/leaves/:id/approve`

**Headers:**
```
Authorization: Bearer CENTRAL_OFFICE_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "comment": "อนุมัติตามที่เสนอ"
}
```

**Result:** สถานะเปลี่ยนเป็น `approved_level2` และส่งต่อไปยัง Admin

---

### 4.3 ไม่อนุมัติคำขอลาระดับ 2

**Endpoint:** `PUT http://localhost:3000/api/central-office/leaves/:id/reject`

**Headers:**
```
Authorization: Bearer CENTRAL_OFFICE_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "comment": "วันลาไม่เหมาะสม เนื่องจากมีการประชุมสำคัญ"
}
```

**⚠️ หมายเหตุ:** comment เป็น required!

---

### 4.4 ดูสถิติการลาทั้งหมด

**Endpoint:** `GET http://localhost:3000/api/central-office/statistics`

**Headers:**
```
Authorization: Bearer CENTRAL_OFFICE_TOKEN
```

**Query Parameters:**
- `year`: ปี (default: ปีปัจจุบัน)
- `month`: เดือน (optional, ถ้าไม่ระบุจะดูทั้งปี)

**ตัวอย่าง:**
```
GET http://localhost:3000/api/central-office/statistics?year=2026&month=1
```

**Response:**
```json
{
  "success": true,
  "message": "Leave statistics retrieved successfully",
  "data": {
    "period": "2026-01",
    "total": 50,
    "byStatus": {
      "pending": 5,
      "approved": 30,
      "rejected": 10,
      "cancelled": 5
    },
    "byType": {
      "ลาป่วย": 20,
      "ลาพักผ่อน": 15,
      "ลากิจ": 10,
      "ลาคลอด": 5
    }
  }
}
```

---

### 4.5 ดูรายงานการลาแยกตามแผนก

**Endpoint:** `GET http://localhost:3000/api/central-office/reports/departments`

**Headers:**
```
Authorization: Bearer CENTRAL_OFFICE_TOKEN
```

**Query Parameters:**
- `page`, `limit`: การแบ่งหน้า

**Response:**
```json
{
  "success": true,
  "message": "Department leave report retrieved successfully",
  "data": {
    "departments": [
      {
        "department": "กองบริหารทั่วไป",
        "totalLeaves": 25,
        "pending": 3,
        "approved": 20
      },
      {
        "department": "กองคลัง",
        "totalLeaves": 15,
        "pending": 2,
        "approved": 10
      }
    ],
    "pagination": {...}
  }
}
```

---

### 4.6 ดูประวัติการอนุมัติทั้งหมด

**Endpoint:** `GET http://localhost:3000/api/central-office/approvals`

**Headers:**
```
Authorization: Bearer CENTRAL_OFFICE_TOKEN
```

**Query Parameters:**
- `page`, `limit`: การแบ่งหน้า
- `approvalLevel`: กรองตาม level (1=Director, 2=Central Office, 3=Admin)

**ตัวอย่าง:**
```
GET http://localhost:3000/api/central-office/approvals?approvalLevel=1
```

---

## 🧪 ขั้นตอนทดสอบ Role 3 (Central Office)

### Step 1: เตรียมข้อมูล
1. Login ด้วย **EMP001** (User)
2. สร้างคำขอลา → ได้ leave_id
3. Login ด้วย **DIR001** (Director)
4. อนุมัติคำขอลานั้น → สถานะเปลี่ยนเป็น `approved_level1`

### Step 2: ทดสอบ Central Office
1. **Login ด้วย CTR001**
   ```json
   POST http://localhost:3000/api/auth/login
   {
     "employeeCode": "CTR001",
     "password": "123456"
   }
   ```
   เก็บ token ไว้

2. **ดูคำขอลาที่รออนุมัติ**
   ```
   GET http://localhost:3000/api/central-office/leaves/pending
   Headers: Authorization: Bearer CTR_TOKEN
   ```
   จะเห็นคำขอลาที่ Director อนุมัติแล้ว

3. **อนุมัติระดับ 2**
   ```json
   PUT http://localhost:3000/api/central-office/leaves/YOUR_LEAVE_ID/approve
   Headers: Authorization: Bearer CTR_TOKEN
   Body:
   {
     "comment": "อนุมัติตามที่เสนอ"
   }
   ```

4. **ดูสถิติการลา**
   ```
   GET http://localhost:3000/api/central-office/statistics?year=2026&month=1
   Headers: Authorization: Bearer CTR_TOKEN
   ```

5. **ดูรายงานตามแผนก**
   ```
   GET http://localhost:3000/api/central-office/reports/departments
   Headers: Authorization: Bearer CTR_TOKEN
   ```

6. **ดูประวัติการอนุมัติ**
   ```
   GET http://localhost:3000/api/central-office/approvals
   Headers: Authorization: Bearer CTR_TOKEN
   ```

---

## 📊 Approval Workflow (ขั้นตอนการอนุมัติ)

```
User สร้างคำขอลา
      ↓
[Status: pending, Level: 1]
      ↓
Director อนุมัติ
      ↓
[Status: approved_level1, Level: 2]
      ↓
Central Office อนุมัติ
      ↓
[Status: approved_level2, Level: 3]
      ↓
Admin อนุมัติ (ขั้นสุดท้าย)
      ↓
[Status: approved_final]
+ หักวันลา
```

---

## ✅ Checklist การทดสอบ Role 3

### Central Office APIs
- [ ] Login ด้วย CTR001 สำเร็จ
- [ ] ดูคำขอลาที่ Director อนุมัติแล้ว
- [ ] อนุมัติคำขอลาระดับ 2 สำเร็จ
- [ ] พยายามอนุมัติซ้ำ (ต้อง error)
- [ ] ไม่อนุมัติพร้อมใส่ comment
- [ ] ดูสถิติการลาตามเดือน/ปี
- [ ] ดูรายงานแยกตามแผนก
- [ ] ดูประวัติการอนุมัติทั้งหมด
- [ ] กรองประวัติตาม approval level

---

---

## 📤 5. File Upload APIs

**หมายเหตุ:** ต้อง login ก่อนและใส่ token ในทุก request!

### 5.1 Upload Document

**Endpoint:** `POST http://localhost:3000/api/uploads/leaves/:id/document`

**Headers:**
```
Authorization: Bearer YOUR_USER_TOKEN
Content-Type: multipart/form-data
```

**Body (form-data):**
- Key: `document`
- Type: File
- Value: [เลือกไฟล์ PDF/JPG/PNG, ขนาดไม่เกิน 5MB]

**Expected Response:**
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "filename": "leave-id_timestamp_filename.pdf",
    "originalName": "medical-cert.pdf",
    "size": "263.57 KB",
    "mimeType": "application/pdf",
    "url": "https://...supabase.co/storage/...",
    "uploadedAt": "2026-01-15T04:33:20.912Z"
  }
}
```

**ไฟล์ที่รองรับ:**
- PDF (.pdf) - ใบรับรองแพทย์, เอกสารทางราชการ
- JPEG/JPG (.jpg, .jpeg) - รูปถ่ายเอกสาร
- PNG (.png) - รูปภาพ, screenshot
- ขนาดสูงสุด: 5 MB

---

### 5.2 Get Leave Documents

**Endpoint:** `GET http://localhost:3000/api/uploads/leaves/:id/documents`

**Headers:**
```
Authorization: Bearer YOUR_USER_TOKEN
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Documents retrieved successfully",
  "data": {
    "documents": [
      {
        "name": "leave-id_timestamp_filename.pdf",
        "url": "https://...supabase.co/storage/...",
        "size": "263.57 KB",
        "uploadedAt": "2026-01-15T04:33:20.912Z"
      }
    ],
    "count": 1
  }
}
```

**สิทธิ์การเข้าถึง:**
- User: ดูเอกสารของตัวเองได้
- Director/Central Office/Admin: ดูเอกสารทุกคนได้

---

### 5.3 Delete Document

**Endpoint:** `DELETE http://localhost:3000/api/uploads/leaves/:id/documents/:fileId`

**Headers:**
```
Authorization: Bearer YOUR_USER_TOKEN
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

**ข้อจำกัด:**
- สามารถลบได้เฉพาะเอกสารของตัวเอง
- ไม่สามารถลบได้ถ้าคำขอลามีสถานะ approved_final หรือ rejected

---

## 📊 6. Reports & Analytics APIs

**หมายเหตุ:** ต้องมีสิทธิ์ Director ขึ้นไป!

### 6.1 Summary Report (รายงานสรุปทั้งหมด)

**Endpoint:** `GET http://localhost:3000/api/reports/summary`

**Headers:**
```
Authorization: Bearer DIRECTOR_TOKEN
```

**Query Parameters (ทั้งหมด optional):**
- `startDate`: วันที่เริ่มต้น (YYYY-MM-DD)
- `endDate`: วันที่สิ้นสุด (YYYY-MM-DD)
- `department`: ชื่อแผนก
- `leaveType`: Leave Type ID
- `status`: สถานะ (pending, approved_final, etc.)

**ตัวอย่าง URLs:**
```
GET http://localhost:3000/api/reports/summary
GET http://localhost:3000/api/reports/summary?startDate=2026-01-01&endDate=2026-12-31
GET http://localhost:3000/api/reports/summary?department=กองบริหารทั่วไป
GET http://localhost:3000/api/reports/summary?status=approved_final
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Summary report retrieved successfully",
  "data": {
    "period": {
      "startDate": "2026-01-01",
      "endDate": "2026-12-31"
    },
    "summary": {
      "totalLeaves": 50,
      "totalDays": 150,
      "avgDaysPerLeave": "3.00"
    },
    "byStatus": {
      "pending": 5,
      "approved_level1": 3,
      "approved_level2": 2,
      "approved_final": 30,
      "rejected": 8,
      "cancelled": 2
    },
    "byType": {
      "ลาป่วย": 25,
      "ลาพักผ่อน": 15,
      "ลากิจ": 10
    },
    "byDepartment": {
      "กองบริหารทั่วไป": 20,
      "กองคลัง": 15,
      "กองช่าง": 15
    },
    "byMonth": {
      "2026-01": 10,
      "2026-02": 12,
      "2026-03": 8
    },
    "recentLeaves": [...]
  }
}
```

---

### 6.2 Department Report (รายงานแยกตามแผนก)

**Endpoint:** `GET http://localhost:3000/api/reports/departments`

**Headers:**
```
Authorization: Bearer DIRECTOR_TOKEN
```

**Query Parameters:**
- `year`: ปี (default: ปีปัจจุบัน)

**ตัวอย่าง:**
```
GET http://localhost:3000/api/reports/departments?year=2026
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Department report retrieved successfully",
  "data": {
    "year": 2026,
    "departments": [
      {
        "department": "กองบริหารทั่วไป",
        "employeeCount": 25,
        "totalLeaves": 50,
        "pending": 3,
        "approved": 40,
        "rejected": 5,
        "avgLeavesPerEmployee": "2.00"
      }
    ],
    "totalDepartments": 5
  }
}
```

---

### 6.3 Employee Report (รายงานพนักงานรายบุคคล)

**Endpoint:** `GET http://localhost:3000/api/reports/employees/:employeeId`

**Headers:**
```
Authorization: Bearer DIRECTOR_TOKEN
```

**Query Parameters:**
- `year`: ปี (default: ปีปัจจุบัน)

**ตัวอย่าง:**
```
GET http://localhost:3000/api/reports/employees/550e8400-e29b-41d4-a716-446655440000?year=2026
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Employee report retrieved successfully",
  "data": {
    "employee": {
      "id": "uuid",
      "employeeCode": "EMP001",
      "name": "นายสมชาย ใจดี",
      "position": "เจ้าพนักงานธุรการ",
      "department": "กองบริหารทั่วไป",
      "leaveBalance": {
        "sick": 25,
        "personal": 0,
        "vacation": 8
      }
    },
    "year": 2026,
    "statistics": {
      "totalLeaves": 10,
      "totalDays": 25,
      "approvedLeaves": 8,
      "approvedDays": 20,
      "byType": {
        "ลาป่วย": 5,
        "ลาพักผ่อน": 3,
        "ลากิจ": 2
      },
      "byStatus": {
        "pending": 1,
        "approved_final": 8,
        "rejected": 1,
        "cancelled": 0
      }
    },
    "leaves": [...]
  }
}
```

---

### 6.4 Leave Balance Report (รายงานวันลาคงเหลือ)

**Endpoint:** `GET http://localhost:3000/api/reports/balance`

**Headers:**
```
Authorization: Bearer DIRECTOR_TOKEN
```

**Query Parameters:**
- `department`: ชื่อแผนก (optional)
- `search`: ค้นหาชื่อหรือรหัสพนักงาน (optional)

**ตัวอย่าง:**
```
GET http://localhost:3000/api/reports/balance
GET http://localhost:3000/api/reports/balance?department=กองบริหารทั่วไป
GET http://localhost:3000/api/reports/balance?search=สมชาย
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Leave balance report retrieved successfully",
  "data": {
    "summary": {
      "totalEmployees": 100,
      "averageBalance": {
        "sick": "25.50",
        "personal": "0.00",
        "vacation": "8.75"
      }
    },
    "lowBalanceAlerts": [
      {
        "employeeCode": "EMP005",
        "name": "นายสมศักดิ์ มีสุข",
        "department": "กองคลัง",
        "sickBalance": 3,
        "vacationBalance": 1
      }
    ],
    "employees": [
      {
        "employeeCode": "EMP001",
        "name": "นายสมชาย ใจดี",
        "position": "เจ้าพนักงานธุรการ",
        "department": "กองบริหารทั่วไป",
        "balance": {
          "sick": 25,
          "personal": 0,
          "vacation": 8,
          "total": 33
        }
      }
    ]
  }
}
```

---

## ✅ Complete Testing Checklist

### Authentication (3 endpoints)
- [ ] Login สำเร็จ
- [ ] Login ผิด password
- [ ] Login รหัสพนักงานไม่มี
- [ ] Get Profile สำเร็จ
- [ ] Get Profile ไม่มี token
- [ ] Change Password สำเร็จ

### User APIs (5 endpoints)
- [ ] สร้างคำขอลาสำเร็จ
- [ ] สร้างลาวันลาไม่พอ
- [ ] ดูรายการลาของตัวเอง
- [ ] ยกเลิกคำขอลาสำเร็จ
- [ ] ดูวันลาคงเหลือ

### Director APIs (6 endpoints)
- [ ] ดูคำขอลาที่รออนุมัติ
- [ ] อนุมัติ Level 1 สำเร็จ
- [ ] ไม่อนุมัติพร้อม comment
- [ ] ดูรายชื่อพนักงาน
- [ ] ดูข้อมูลพนักงาน 1 คน
- [ ] ดูประวัติการลาของพนักงาน

### Central Office APIs (6 endpoints)
- [ ] ดูคำขอลาที่ผ่าน Director
- [ ] อนุมัติ Level 2 สำเร็จ
- [ ] ไม่อนุมัติพร้อม comment
- [ ] ดูสถิติการลา
- [ ] ดูรายงานตามแผนก
- [ ] ดูประวัติการอนุมัติ

### Admin APIs (7 endpoints)
- [ ] ดูคำขอลาที่ผ่าน Central Office
- [ ] อนุมัติ Final + หักวันลา
- [ ] ไม่อนุมัติ Final
- [ ] ดู Dashboard
- [ ] ดูรายชื่อ users ทั้งหมด
- [ ] ดูข้อมูล user 1 คน
- [ ] ดู leave types

### File Upload APIs (3 endpoints)
- [ ] Upload ไฟล์ PDF สำเร็จ
- [ ] Upload ไฟล์เกิน 5MB (error)
- [ ] Upload ไฟล์ประเภทไม่ถูกต้อง (error)
- [ ] ดูรายการเอกสาร
- [ ] ลบเอกสารสำเร็จ

### Reports APIs (4 endpoints)
- [ ] Summary Report ทั้งหมด
- [ ] Summary Report กรองตามช่วงเวลา
- [ ] Department Report
- [ ] Employee Report
- [ ] Balance Report

---

**เมื่อทดสอบครบแล้ว พร้อม Deploy Production!** 🚀
