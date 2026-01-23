# 🏛️ ระบบการลาออนไลน์สำหรับข้าราชการ

## 📌 ภาพรวมโปรเจค

ระบบการลาออนไลน์สำหรับเจ้าพนักงานราชการ ที่ออกแบบตามกฎหมายการลาของข้าราชการไทย มีระบบการอนุมัติแบบหลายขั้นตอนและการจัดการสิทธิ์ตาม Role-Based Access Control (RBAC)

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
- [x] ออกแบบ Schema
- [x] สร้างตาราง 7 ตาราง
- [x] ตั้งค่า RLS Policies
- [x] สร้าง Sample Data
- [x] เขียนคู่มือการ Setup

### 🔄 Phase 2: Backend Development (กำลังทำ)
- [ ] Authentication System
- [ ] Role 1: User APIs
- [ ] Role 2: Director APIs
- [ ] Role 3: Central Office APIs
- [ ] Role 4: Admin APIs

### ⏳ Phase 3: Frontend Development
- [ ] Login Page
- [ ] User Dashboard
- [ ] Leave Request Form
- [ ] Director Dashboard
- [ ] Central Office Dashboard
- [ ] Admin Dashboard

### ⏳ Phase 4: Testing & Deployment
- [ ] Unit Tests
- [ ] Integration Tests
- [ ] User Acceptance Testing (UAT)
- [ ] Deployment

---

## 🔐 ข้อมูลทดสอบ (Sample Data)

| Employee Code | Password | Role | ชื่อ-นามสกุล |
|--------------|----------|------|-------------|
| `EMP001` | `123456` | User | นายสมชาย ใจดี |
| `EMP002` | `123456` | User | นางสาวสมหญิง รักงาน |
| `DIR001` | `123456` | Director | นายวิชัย ผู้นำ |
| `CTR001` | `123456` | Central Office | นางสุดา รอบคอบ |
| `ADMIN001` | `123456` | Admin | นายประสิทธิ์ เด็ดขาด |

---

## 📞 ติดต่อ / ช่วยเหลือ

หากมีปัญหาหรือข้อสงสัย:
1. อ่านคู่มือใน `database/README.md` สำหรับ Database
2. อ่านคู่มือใน `backend/README.md` สำหรับ Backend
3. อ่านคู่มือใน `frontend/README.md` สำหรับ Frontend

---

## 📄 License

ระบบนี้พัฒนาขึ้นเพื่อใช้ภายในองค์กรเท่านั้น

---

**สถานะ**: 🟢 กำลังพัฒนา Phase 1 เสร็จสิ้น, Phase 2 เริ่มต้น
**Last Updated**: 15 มกราคม 2026
