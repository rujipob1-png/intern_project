import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addColumn() {
  try {
    console.log('🔧 Adding selected_dates column...\n');

    // ใช้ Postgres REST API ของ Supabase
    const sql = `
ALTER TABLE leaves ADD COLUMN IF NOT EXISTS selected_dates DATE[];

-- อัพเดทข้อมูลเก่า
UPDATE leaves 
SET selected_dates = ARRAY(
    SELECT generate_series(start_date, end_date, '1 day'::interval)::date
)
WHERE selected_dates IS NULL;
`;

    console.log('📝 SQL to execute:');
    console.log(sql);
    console.log('\n');

    // ตรวจสอบการเชื่อมต่อ
    const { data, error } = await supabase.from('leaves').select('count').limit(1);
    
    if (error) {
      console.error('❌ Database connection error:', error.message);
      process.exit(1);
    }

    console.log('✅ Database connected successfully');
    console.log('\n⚠️  Supabase REST API ไม่รองรับ ALTER TABLE โดยตรง');
    console.log('\n📋 กรุณาทำตามขั้นตอนนี้:');
    console.log('─'.repeat(70));
    console.log('1. เปิดเบราว์เซอร์ไปที่: https://supabase.com/dashboard');
    console.log('2. เลือก Project ของคุณ');
    console.log('3. ไปที่ SQL Editor (เมนูด้านซ้าย)');
    console.log('4. คลิก "New query"');
    console.log('5. Copy SQL ด้านบนไป Paste');
    console.log('6. คลิก "Run" หรือกด Ctrl+Enter');
    console.log('─'.repeat(70));
    console.log('\n💡 หรือใช้ไฟล์: database/add_selected_dates_column.sql');
    console.log('\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addColumn();
