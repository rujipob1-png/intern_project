# 📊 เปรียบเทียบข้อมูลเก่า vs ใหม่

## ตัวอย่าง: EMP001 (นายสมชาย ใจดี)

### ❌ ข้อมูลเก่า (sample_data.sql)
```
┌─────────────────────────────────────┐
│  Schema เก่า - TEXT ธรรมชาติ        │
├─────────────────────────────────────┤
│ Employee Code: EMP001               │
│ Title: นาย                          │
│ First Name: สมชาย                   │
│ Last Name: ใจดี                     │
│ Position: เจ้าพนักงานธุรการ         │
│ Department: "กองบริหารทั่วไป"       │ ← เป็นข้อความปกติ
│ Phone: 081-234-5678                 │
│ Role: user                          │
│                                     │
│ Leave Balance:                      │
│   - Sick: 30 วัน                    │
│   - Personal: 0 วัน                 │
│   - Vacation: 10 วัน                │
└─────────────────────────────────────┘
```

### ✅ ข้อมูลใหม่ (sample_data_4_levels.sql)
```
┌─────────────────────────────────────┐
│  Schema ใหม่ - FK ไปยัง Dept Table  │
├─────────────────────────────────────┤
│ Employee Code: EMP001               │
│ Title: นาย                          │
│ First Name: สมชาย                   │
│ Last Name: ใจดี                     │
│ Position: นักวิเคราะห์ระบบ         │
│ Department ID: xxxxx (FK)           │ ← เป็น Foreign Key
│ Department: "กองเทคโนโลยีสารสนเทศ" │   (ดึงจาก departments table)
│ Phone: 081-111-1001                 │
│ Role: user                          │
│                                     │
│ Leave Balance:                      │
│   - Sick: 30 วัน                    │
│   - Personal: 3 วัน                 │ ← เปลี่ยนจาก 0
│   - Vacation: 10 วัน                │
└─────────────────────────────────────┘
```

---

## 🎭 เปรียบเทียบ Roles & Levels

### ❌ ระบบเก่า (4 Levels)
```
user
 ↓
director
 ↓
central_office
 ↓
admin
```

### ✅ ระบบใหม่ (4-Level Approval Process)
```
User (Level 1)
 ↓
Director (Level 2 - อนุมัติระดับ 1)
 ↓
Central Office Staff (Level 3 - ตรวจสอบ)
 ↓
Central Office Head (Level 4 - อนุมัติระดับ 3)
 ↓
Admin (Level 5 - ผู้อำนวยการสูงสุด)
```

---

## 📋 รายชื่อ Users ทั้ง 2 ฉบับ

### ❌ ข้อมูลเก่า (sample_data.sql)
```
1. EMP001 - นายสมชาย ใจดี (user, กองบริหารทั่วไป)
2. EMP002 - นางสาวสมหญิง รักงาน (user, กองการเงิน)
3. DIR001 - นายวิชัย ผู้นำ (director, กองบริหารทั่วไป)
4. CTR001 - นางสุดา รอบคอบ (central_office, กองอำนวยการ)
5. ADMIN001 - นายประสิทธิ์ เด็ดขาด (admin, สำนักงานผู้อำนวยการ)
```

### ✅ ข้อมูลใหม่ (sample_data_4_levels.sql)
```
กอง IT (Department ID: xxx)
├─ EMP001 - นายสมชาย ใจดี (user, นักวิเคราะห์ระบบ)
├─ EMP002 - นางสาวสมหญิง รักงาน (user, โปรแกรมเมอร์)
└─ DIR001 - นายวิชัย เทคโนโลยี (director, ผู้อำนวยการกองเทคโนโลยี)

กอง HR (Department ID: yyy)
├─ EMP003 - นางจินตนา ดูแลดี (user, เจ้าหน้าที่ทรัพยากรบุคคล)
├─ EMP004 - นายประเสริฐ มานะ (user, นักทรัพยากรบุคคล)
└─ DIR002 - นางสุภาพร จัดการดี (director, ผู้อำนวยการกองทรัพยากรบุคคล)

กอง FIN (Department ID: zzz)
├─ EMP005 - นางวิมล คำนวณ (user, นักบัญชี)
├─ EMP006 - นายสมศักดิ์ เงินดี (user, เจ้าหน้าที่การเงิน)
└─ DIR003 - นายอนันต์ ละเอียด (director, ผู้อำนวยการกองการเงินและบัญชี)

กองกลาง (Department ID: aaa)
├─ CTR001 - นางสาวพิมพ์ใจ ตรวจสอบ (central_office_staff)
└─ CTR002 - นางสุดา รอบคอบ (central_office_head)

Admin (Department ID: bbb)
└─ ADMIN001 - นายประสิทธิ์ ผู้นำองค์กร (admin)
```

---

## 💾 ตาราง/Columns ที่เปลี่ยนแปลง

### users table

| Column | เก่า | ใหม่ | หมายเหตุ |
|--------|------|------|---------|
| `department` | VARCHAR(100) | ❌ ลบออก | |
| `department_id` | ❌ ไม่มี | UUID (FK) | ✅ เพิ่มใหม่ |
| `personal_leave_balance` | DEFAULT 0 | DEFAULT 3 | ✅ เปลี่ยนค่า default |

### roles table

| role_name | Level เก่า | Level ใหม่ | เปลี่ยนแปลง |
|-----------|-----------|-----------|-----------|
| user | 1 | 1 | - |
| director | 2 | 2 | - |
| central_office | 3 | ❌ ลบ | |
| central_office_staff | ❌ ไม่มี | 3 | ✅ เพิ่มใหม่ |
| central_office_head | ❌ ไม่มี | 4 | ✅ เพิ่มใหม่ |
| admin | 4 | 5 | ✅ เปลี่ยน level |

---

## 🚨 ผลกระทบที่เห็น

### บน Dashboard (ตอนนี้ ❌)
```
Dashboard แสดง:
├─ Employee: นายสมชาย ใจดี
├─ Role: user ✅
├─ Department: "กองบริหารทั่วไป" ✅
├─ Leave Balance:
│  ├─ ลาป่วย (U): 30/30 ✅
│  ├─ ลาพักผ่อน (W): 10/10 ✅
│  ├─ ลากิจ (n): 3/3 ✅ แต่ DB เก่าคือ 0!
│  └─ ค่าอื่น: 0
└─ Leave History:
   └─ ไม่มีข้อมูล ❌ (หรือแสดงจาก เก่า)
```

### หลังแก้ (ควรเป็น ✅)
```
Dashboard แสดง:
├─ Employee: นายสมชาย ใจดี ✅
├─ Role: user ✅
├─ Department: กองเทคโนโลยีสารสนเทศ (FK) ✅
├─ Position: นักวิเคราะห์ระบบ ✅
├─ Leave Balance:
│  ├─ ลาป่วย (U): 30/30 ✅
│  ├─ ลาพักผ่อน (W): 10/10 ✅
│  ├─ ลากิจ (n): 3/3 ✅
│  └─ ค่าอื่น: 0
└─ Leave History:
   └─ LV-202601-0004 (W) 17/01/2026 - 23/01/2026 ✅
```

---

## 📌 ข้อสรุป

| เรื่อง | เก่า | ใหม่ | ประสิทธิภาพ |
|--------|------|------|-----------|
| Department structure | TEXT | FK | ✅ ดีขึ้น (normalize) |
| Roles & Levels | 4 | 5 | ✅ ชัดเจนขึ้น |
| Leave Types | ไม่ชัดเจน | ✅ SICK, VACATION, PERSONAL | ✅ ดีขึ้น |
| Data Integrity | ❌ อาจมีข้อมูลซ้ำ/ผิด | ✅ FK constraints | ✅ ดีขึ้น |
| Scalability | เกือบจะ OK | ✅ ดีมาก | ✅ ดีขึ้น |

