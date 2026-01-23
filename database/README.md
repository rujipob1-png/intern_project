# 📚 คู่มือการ Setup Supabase สำหรับระบบการลาออนไลน์

## 🎯 ขั้นตอนการเริ่มต้น

### 1. สร้าง Supabase Project

1. เข้าไปที่ https://supabase.com
2. คลิก "Start your project" หรือ "New Project"
3. กรอกข้อมูล:
   - **Project name**: `leave-management-system` (หรือชื่อที่ต้องการ)
   - **Database Password**: กำหนดรหัสผ่าน (เก็บไว้ดีๆ)
   - **Region**: เลือก `Southeast Asia (Singapore)` (ใกล้ไทยที่สุด)
4. คลิก "Create new project" และรอประมาณ 2-3 นาที

---

## 📋 ขั้นตอนการสร้าง Database

### 2. เปิด SQL Editor

1. หลังจาก Project สร้างเสร็จแล้ว ไปที่เมนูด้านซ้าย
2. คลิกที่ **"SQL Editor"**
3. คลิก **"New query"**

### 3. Run Schema SQL

1. เปิดไฟล์ `database/schema.sql` ในโปรเจค
2. **คัดลอกโค้ดทั้งหมด** ในไฟล์
3. **วางลงใน SQL Editor** ของ Supabase
4. คลิกปุ่ม **"Run"** (หรือกด Ctrl+Enter)
5. รอจนขึ้นข้อความ "Success. No rows returned"

**ผลลัพธ์ที่ได้:**
- ✅ สร้างตาราง 7 ตาราง (roles, users, leave_types, leaves, approvals, leave_history, leave_balance_logs)
- ✅ Insert ข้อมูล roles และ leave_types เริ่มต้น
- ✅ สร้าง Indexes, Triggers, และ Functions
- ✅ ตั้งค่า Row Level Security (RLS)

### 4. Run Sample Data (Optional - สำหรับทดสอบ)

1. เปิดไฟล์ `database/sample_data.sql`
2. **คัดลอกโค้ดทั้งหมด**
3. **สร้าง Query ใหม่** ใน SQL Editor
4. **วางโค้ดแล้วกด Run**

**ผลลัพธ์ที่ได้:**
- ✅ สร้าง Users ตัวอย่าง 5 คน (ครบทั้ง 4 role)
- ✅ สร้างคำขอลาตัวอย่าง 3 รายการ
- ✅ สร้างประวัติการอนุมัติตัวอย่าง

---

## 🔍 ตรวจสอบว่าสร้างสำเร็จหรือไม่

### ดูตารางที่สร้างแล้ว

1. ไปที่เมนู **"Table Editor"** ด้านซ้าย
2. คุณจะเห็นตารางทั้งหมด:
   - `roles` (4 rows)
   - `users` (0 rows หรือ 5 rows ถ้า run sample_data)
   - `leave_types` (9 rows)
   - `leaves`
   - `approvals`
   - `leave_history`
   - `leave_balance_logs`

### ทดสอบ Query ข้อมูล

กลับไปที่ **SQL Editor** แล้ว Run คำสั่งเหล่านี้:

```sql
-- ดูข้อมูล Roles
SELECT * FROM roles;

-- ดูข้อมูล Leave Types
SELECT * FROM leave_types;

-- ดูข้อมูล Users (ถ้ามี)
SELECT employee_code, first_name, last_name, position, 
       (SELECT role_name FROM roles WHERE id = users.role_id) as role
FROM users;

-- ดูข้อมูลจาก View
SELECT * FROM leave_details;
```

---

## 🔐 ตั้งค่า Authentication

### 1. ปิด Email Confirmation (สำหรับทดสอบ)

1. ไปที่ **"Authentication"** > **"Settings"** > **"Auth Settings"**
2. หัวข้อ **"Enable email confirmations"** - ปิดไว้ก่อน (OFF)
3. คลิก **"Save"**

### 2. เปิดใช้งาน Custom Claims (สำหรับ Role-based Access)

ใน SQL Editor, Run:

```sql
-- Function สำหรับเพิ่ม custom claims ใน JWT token
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  claims jsonb;
  user_role text;
  user_role_level int;
BEGIN
  -- Get user role from users table
  SELECT r.role_name, r.role_level INTO user_role, user_role_level
  FROM public.users u
  JOIN public.roles r ON u.role_id = r.id
  WHERE u.id::text = (event->>'user_id')::text;
  
  claims := event->'claims';
  
  IF user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
    claims := jsonb_set(claims, '{user_role_level}', to_jsonb(user_role_level));
  END IF;

  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;

REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM anon;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM public;
```

---

## 🔑 ดึง API Keys และ URL

### 1. หา Project URL และ API Keys

1. ไปที่ **"Settings"** (เมนูด้านล่างซ้าย)
2. คลิก **"API"**
3. คุณจะเห็น:
   - **Project URL**: `https://xxxxxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (คีย์สำหรับ Frontend)
   - **service_role key**: `eyJhbGc...` (คีย์สำหรับ Backend - เก็บเป็นความลับ!)

### 2. สร้างไฟล์ .env

สร้างไฟล์ `.env` ในโปรเจค Backend ของคุณ:

```env
# Supabase Configuration
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (เก็บเป็นความลับ!)

# JWT Secret (หาได้จาก Settings > API > JWT Settings)
SUPABASE_JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters

# Application
PORT=3000
NODE_ENV=development
```

---

## 📦 ตั้งค่า Storage (สำหรับเก็บเอกสารแนบ)

### 1. สร้าง Storage Bucket

1. ไปที่ **"Storage"** ในเมนูด้านซ้าย
2. คลิก **"Create a new bucket"**
3. กรอกข้อมูล:
   - **Name**: `leave-documents`
   - **Public bucket**: ❌ ปิดไว้ (Private)
   - **Allowed MIME types**: `application/pdf,image/jpeg,image/png,image/jpg`
   - **File size limit**: `5242880` (5 MB)
4. คลิก **"Create bucket"**

### 2. ตั้งค่า Storage Policies

ใน SQL Editor, Run:

```sql
-- Policy: Users can upload their own documents
CREATE POLICY "Users can upload their own leave documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'leave-documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can view their own documents
CREATE POLICY "Users can view their own leave documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'leave-documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Approvers can view all documents
CREATE POLICY "Approvers can view all leave documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'leave-documents'
    AND EXISTS (
        SELECT 1 FROM public.users u
        JOIN public.roles r ON u.role_id = r.id
        WHERE u.id::text = auth.uid()::text 
        AND r.role_level >= 2
    )
);
```

---

## ✅ Checklist การ Setup

- [ ] สร้าง Supabase Project เรียบร้อย
- [ ] Run `schema.sql` สำเร็จ (ได้ 7 ตาราง)
- [ ] Run `sample_data.sql` สำเร็จ (ถ้าต้องการข้อมูลทดสอบ)
- [ ] ตรวจสอบตารางใน Table Editor แล้ว
- [ ] ดึง API Keys และ URL มาแล้ว
- [ ] สร้างไฟล์ `.env` แล้ว
- [ ] สร้าง Storage Bucket `leave-documents` แล้ว
- [ ] ตั้งค่า Storage Policies แล้ว

---

## 📊 โครงสร้าง Database ที่ได้

```
┌─────────────────────────────────────────────────┐
│                    ROLES                        │
│  - user (level 1)                               │
│  - director (level 2)                           │
│  - central_office (level 3)                     │
│  - admin (level 4)                              │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│                    USERS                        │
│  - employee_code (รหัสตำแหน่ง - สำหรับ login)   │
│  - password_hash                                │
│  - ข้อมูลส่วนตัว                                 │
│  - role_id (FK)                                 │
│  - sick_leave_balance                           │
│  - personal_leave_balance                       │
│  - vacation_leave_balance                       │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│                   LEAVES                        │
│  - leave_number (auto-generate)                 │
│  - user_id (FK)                                 │
│  - leave_type_id (FK)                           │
│  - start_date, end_date, total_days             │
│  - reason, contact_address                      │
│  - status (pending/approved/rejected/cancelled) │
│  - current_approval_level (1-4)                 │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│                  APPROVALS                      │
│  - leave_id (FK)                                │
│  - approver_id (FK)                             │
│  - approval_level (1-3)                         │
│  - action (approved/rejected)                   │
│  - comment                                      │
└─────────────────────────────────────────────────┘
```

---

## 🎓 ขั้นตอนถัดไป

หลังจาก Setup Database เสร็จแล้ว:

1. ✅ **Database สำเร็จแล้ว!**
2. ➡️ ต่อไปเราจะไปสร้าง **Backend API** 
   - สร้าง Node.js + Express
   - เชื่อมต่อกับ Supabase
   - สร้าง Authentication endpoints
   - สร้าง CRUD APIs สำหรับแต่ละ Role

---

## 🆘 หากเกิดปัญหา

### ไม่สามารถ Run SQL ได้
- ✅ ตรวจสอบว่าคัดลอกโค้ดครบถ้วน
- ✅ ลอง Run ทีละส่วน (แยก CREATE TABLE แต่ละตาราง)

### ไม่เห็นตารางใน Table Editor
- ✅ Refresh หน้าเว็บ
- ✅ ตรวจสอบว่า SQL ไม่มี Error

### Storage Policy ใช้ไม่ได้
- ✅ ตรวจสอบว่าเปิด RLS ใน Storage bucket แล้ว
- ✅ ลอง Refresh หน้าเว็บ

---

## 📞 พร้อมแล้ว?

หลังจาก Setup Database เสร็จ บอกได้เลยครับ แล้วเราจะไปต่อที่:
👉 **Backend Development - Authentication & Role 1 (User APIs)**
