# 🔧 แก้ปัญหา "selected_dates column not found in schema cache"

## สาเหตุ:
Column `selected_dates` ถูกเพิ่มใน database แล้ว แต่ **PostgREST (Supabase API) ยัง cache schema เก่าอยู่**

## วิธีแก้ (ทำตามลำดับ):

### ✅ วิธีที่ 1: Restart PostgREST API ใน Supabase Dashboard

1. **เปิด Supabase Dashboard**: https://supabase.com/dashboard
2. **เลือก Project** ของคุณ
3. **ไปที่ Settings** (เมนูด้านซ้าย ล่างสุด)
4. **เลือก API**
5. **Scroll ลงมาหา section "PostgREST"**
6. **คลิกปุ่ม "Restart server"** หรือ **"Reload schema cache"**
7. **รอ 30-60 วินาที**

### ✅ วิธีที่ 2: ใช้ SQL บังคับ Reload หลายครั้ง

รัน SQL นี้ใน **SQL Editor**:

```sql
-- Reload schema cache multiple times
DO $$
BEGIN
    -- Reload 5 times with delays
    FOR i IN 1..5 LOOP
        PERFORM pg_notify('pgrst', 'reload schema');
        PERFORM pg_notify('pgrst', 'reload config');
        PERFORM pg_sleep(1);
    END LOOP;
END $$;

SELECT '✅ Schema reloaded 5 times - wait 30 seconds' as message;
```

### ✅ วิธีที่ 3: ตรวจสอบ Environment Variables

ตรวจสอบใน `.env` file:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  ← ต้องมีและถูกต้อง
```

### ✅ วิธีที่ 4: Clear Cache ทั้งหมด

1. **ปิด browser ทั้งหมด**
2. **หยุด backend** (Ctrl+C)
3. **รัน SQL ใน Supabase:**
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```
4. **รอ 30 วินาที**
5. **Start backend ใหม่:** `npm run dev`
6. **เปิด browser ใหม่** (Private/Incognito mode)
7. **Login และลองส่งคำขอลาใหม่**

### ✅ วิธีที่ 5: ตรวจสอบว่า Column มีจริง

รัน SQL นี้:
```sql
-- ตรวจสอบ column
SELECT column_name, data_type, table_name
FROM information_schema.columns
WHERE table_name = 'leaves'
ORDER BY ordinal_position;
```

ต้องเห็น `selected_dates | ARRAY` ในรายการ

---

## 🎯 After Fix Checklist:

- [ ] Supabase API restarted
- [ ] รอ 30-60 วินาที
- [ ] Backend restarted
- [ ] Browser hard refresh (Ctrl+Shift+R)
- [ ] ลองส่งคำขอลาใหม่
- [ ] ✅ ใช้งานได้!

---

## 📌 Note:
ปัญหานี้เกิดจาก **Supabase PostgREST caches the database schema**  
การ ALTER TABLE ไม่ทำให้ cache refresh อัตโนมัติ ต้อง restart API หรือ notify manually
