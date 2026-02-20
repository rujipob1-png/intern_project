# 🏛️ ระบบการลาออนไลน์สำหรับข้าราชการ

## 📌 ภาพรวมโปรเจค

ระบบการลาออนไลน์สำหรับเจ้าพนักงานราชการ ที่ออกแบบตามกฎหมายการลาของข้าราชการไทย มีระบบการอนุมัติแบบหลายขั้นตอน (4 levels) และการจัดการสิทธิ์ตาม Role-Based Access Control (RBAC)

## 🚀 เริ่มต้นใช้งาน

### ความต้องการของระบบ
- Node.js 18+ 
- PostgreSQL (ผ่าน Supabase)
- npm หรือ yarn

### การติดตั้ง

1. **Clone repository**
```bash
git clone https://github.com/rujipob1-png/intern_project.git
cd intern_project
```

2. **ติดตั้ง Dependencies**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. **ตั้งค่า Environment Variables**

สร้างไฟล์ `.env` ใน `backend/`:
```env
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
```

สร้างไฟล์ `.env` ใน `frontend/`:
```env
VITE_API_URL=http://localhost:3000
```

4. **ตั้งค่า Database**
```bash
cd backend
# รัน SQL scripts ตามลำดับใน database/ folder
# - schema.sql
# - sample_data_4_levels.sql
# - storage_setup.sql
```

5. **รันโปรเจค**
```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend  
cd frontend
npm run dev
```

6. **เข้าใช้งาน**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

### 🔑 ข้อมูลเข้าสู่ระบบทดสอบ

| Role | รหัสพนักงาน | รหัสผ่าน | ชื่อ |
|------|-------------|----------|------|
| User (เจ้าหน้าที่) | 51101 | 123456 | นางปิยนุช มงคล |
| Director (ผอ.กยส.) | 51497 | 123456 | น.ส.ธมนต์รัตน์ แสนสายเนตร |
| Central Office Staff | 51417 | 123456 | นายอานนท์ กรวดแก้ว |
| Central Office Head (ผอ.กอก.) | 51410 | 123456 | นายคมกฤช บัวคำ |
| Admin (ผอ.สำนัก) | 50001 | 123456 | นายวิชัย ศรีสุวรรณ |

## 🎯 คุณสมบัติหลัก

### 🔐 Authentication
- Login ด้วยรหัสตำแหน่ง (Employee Code) และรหัสผ่าน
- JWT Token-based Authentication
- Role-Based Access Control (4 Roles)

### 👥 4 Roles ในระบบ

#### 1️⃣ **User (เจ้าพนักงานทั่วไป)**
- ✅ กรอกฟอร์มการลา
- ✅ ยกเลิกการลา (ไม่เสียสิทธิ์วันลา)
- ✅ ดูประวัติการลาของตนเอง
- ✅ ดูสิทธิ์วันลาคงเหลือ

#### 2️⃣ **Director (ผู้อำนวยการกอง)**
- ✅ ตรวจสอบและอนุมัติ/ไม่อนุมัติคำขอลา (ระดับ 1)
- ✅ เขียนความเห็น/เหตุผล
- ✅ ดูข้อมูลส่วนตัวของพนักงานในกอง (Read-only)
- ✅ ดูประวัติการลาของพนักงานในกอง

#### 3️⃣ **Central Office (กองอำนวยการ/กองกลาง)**
- ✅ ตรวจสอบเอกสารรอบที่ 2 (หลังผู้อำนวยการอนุมัติ)
- ✅ อนุมัติ/ไม่อนุมัติ (ระดับ 2)
- ✅ ดูข้อมูลการลาทั้งหมด
- ✅ ดูข้อมูลส่วนตัวของพนักงาน (Read-only)

#### 4️⃣ **Admin (หัวหน้าศูนย์/ผู้บริหารสูงสุด)**
- ✅ อนุมัติขั้นสุดท้าย (ระดับ 3)
- ✅ ดูข้อมูลพนักงานทุกคน (Read-only)
- ✅ ดูสถิติการลาทั้งหมด
- ✅ อำนาจตัดสินใจสูงสุด

### 📝 ประเภทการลา (ตามกฎหมาย)

| ประเภท | จำนวนวัน/ปี | ต้องแนบเอกสาร | ได้รับเงินเดือน |
|--------|--------------|---------------|---------------|
| ลาป่วย | 30 วัน | ❌ | ✅ |
| ลากิจส่วนตัว | ตามเกณฑ์ | ❌ | ✅ |
| ลาพักผ่อน | 10 วัน | ❌ | ✅ |
| ลาคลอดบุตร | 90 วัน | ✅ | ✅ |
| คลอดบุตร (บิดา) | 15 วัน | ✅ | ✅ |
| ลาประกอบพิธีฮัจย์ | ไม่จำกัด | ✅ | ✅ |
| ลาอุปสมบท | ไม่จำกัด | ✅ | ✅ |
| ลาเพื่อรับราชการทหาร | ไม่จำกัด | ✅ | ❌ |
| ลาอื่นๆ | ไม่จำกัด | - | ✅ |

### 🔄 Workflow การอนุมัติ

```
User ยื่นคำขอลา
      ↓
[รอการอนุมัติ] → ผู้อำนวยการกอง (Level 1)
      ↓                    ↓
  ✅ อนุมัติ           ❌ ไม่อนุมัติ (จบ)
      ↓
[รอการอนุมัติ] → กองอำนวยการ (Level 2)
      ↓                    ↓
  ✅ อนุมัติ           ❌ ไม่อนุมัติ (จบ)
      ↓
[รอการอนุมัติ] → Admin หัวหน้าศูนย์ (Level 3)
      ↓                    ↓
  ✅ อนุมัติ           ❌ ไม่อนุมัติ (จบ)
      ↓
[อนุมัติแล้ว] 🎉
```

---

## 🗂️ โครงสร้างโปรเจค

```
spoon_intern/
├── database/                  # Database Schema และ Scripts
│   ├── schema.sql            # Schema หลักสำหรับ Supabase
│   ├── sample_data.sql       # ข้อมูลตัวอย่างสำหรับทดสอบ
│   └── README.md             # คู่มือการ Setup Supabase
│
├── backend/                   # Backend API (Node.js + Express)
│   ├── src/
│   │   ├── config/           # Configuration files
│   │   ├── controllers/      # Route controllers
│   │   ├── middlewares/      # Custom middlewares (auth, role)
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   ├── utils/            # Utility functions
│   │   └── app.js           # Express app entry
│   ├── .env                  # Environment variables
│   ├── package.json
│   └── README.md
│
├── frontend/                  # Frontend (React/Next.js)
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Pages
│   │   ├── hooks/            # Custom hooks
│   │   ├── contexts/         # Context API
│   │   ├── services/         # API services
│   │   └── utils/            # Utility functions
│   ├── .env
│   ├── package.json
│   └── README.md
│
├── docs/                      # เอกสารประกอบ
│   ├── api-documentation.md  # API Docs
│   └── user-manual.md        # คู่มือใช้งาน
│
└── README.md                 # ไฟล์นี้
```

---

## 🛠️ เทคโนโลยีที่ใช้

### Database
- **Supabase** (PostgreSQL + Real-time + Storage)
- Row Level Security (RLS) policies
- Auto-generated Leave Numbers
- Trigger Functions

### Backend
- **Node.js** + **Express.js**
- **Supabase JS Client**
- **JWT** (JSON Web Tokens)
- **bcrypt** (Password hashing)
- **multer** (File upload)

### Frontend
- **React.js** / **Next.js**
- **TailwindCSS** (Styling)
- **React Hook Form** (Form handling)
- **React Query** (Data fetching)
- **Zustand** (State management)

---

## 🚀 การติดตั้งและใช้งาน

### 1. Setup Database (Supabase)

```bash
# อ่านคู่มือใน database/README.md
cd database
# จากนั้น run SQL files ใน Supabase SQL Editor
```

### 2. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
# แก้ไข .env ใส่ค่า Supabase
npm run dev
```

### 3. Setup Frontend

```bash
cd frontend
npm install
cp .env.example .env
# แก้ไข .env ใส่ค่า Backend URL
npm run dev
```

---

## 📋 สถานะการพัฒนา

### ✅ Phase 1: Database Design (เสร็จแล้ว)
- [x] ออกแบบ Schema แบบ 4-level approval
- [x] สร้างตาราง 8 ตาราง (users, departments, leave_types, leaves, approvals, notifications, settings, documents)
- [x] ตั้งค่า RLS Policies และ Supabase Storage
- [x] สร้าง Sample Data
- [x] เขียนคู่มือการ Setup

### ✅ Phase 2: Backend Development (เสร็จแล้ว)
- [x] Authentication System (JWT)
- [x] User APIs (create leave, cancel leave, view history)
- [x] Director APIs (approve level 1)
- [x] Central Office APIs (approve level 2 & 3)
- [x] Admin APIs (approve final, manage users)
- [x] File Upload System (Supabase Storage)
- [x] Leave Balance Calculation

### ✅ Phase 3: Frontend Development (เสร็จแล้ว)
- [x] Login Page
- [x] User Dashboard (leave balance, statistics)
- [x] Leave Request Form (with file upload)
- [x] My Leaves Page (cancel with reason modal)
- [x] Leave Detail Page (timeline, document view/download)
- [x] Director Dashboard
- [x] Central Office Dashboard (Staff & Head)
- [x] Admin Dashboard
- [x] Responsive Design

### ⏳ Phase 4: Testing & Deployment (ถัดไป)
- [ ] Unit Tests
- [ ] Integration Tests
- [ ] User Acceptance Testing (UAT)
- [ ] Production Deployment

---

## 📞 ติดต่อ / ช่วยเหลือ

หากมีปัญหาหรือข้อสงสัย:
1. อ่านคู่มือใน `database/README.md` สำหรับ Database
2. อ่านคู่มือใน `backend/README.md` สำหรับ Backend API
3. อ่านคู่มือใน `frontend/README.md` สำหรับ Frontend

---

## 📄 License

MIT License - ระบบนี้พัฒนาขึ้นเพื่อใช้ภายในองค์กรและการศึกษา

---

**สถานะ**: 🟢 Phase 1-3 เสร็จสมบูรณ์, พร้อม Production
**Last Updated**: 23 มกราคม 2026
