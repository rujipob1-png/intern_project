import { supabaseAdmin } from './src/config/supabase.js';

async function testSelectedDatesColumn() {
  try {
    console.log('🧪 Testing selected_dates column...\n');

    // ทดสอบว่า column มีอยู่หรือไม่
    const { data, error } = await supabaseAdmin
      .from('leaves')
      .select('id, selected_dates, start_date, end_date')
      .limit(1);

    if (error) {
      if (error.message.includes('selected_dates')) {
        console.log('❌ Column selected_dates ยังไม่มีใน database');
        console.log('   กรุณารัน SQL ใน Supabase SQL Editor ก่อน\n');
        process.exit(1);
      } else {
        throw error;
      }
    }

    console.log('✅ Column selected_dates มีอยู่ใน database แล้ว!');
    console.log('✅ ระบบพร้อมใช้งาน - สามารถส่งคำขอลาได้แล้ว\n');
    
    if (data && data.length > 0) {
      console.log('📋 ตัวอย่างข้อมูล:');
      console.log(JSON.stringify(data[0], null, 2));
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testSelectedDatesColumn();
