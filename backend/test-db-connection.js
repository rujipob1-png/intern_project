import { supabaseAdmin } from './src/config/supabase.js';

async function testConnection() {
  console.log('🔍 Testing Database Connection...\n');

  try {
    // 1. ทดสอบการเชื่อมต่อพื้นฐาน
    console.log('1️⃣ Testing basic connection...');
    const { data: healthCheck, error: healthError } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);
    
    if (healthError) {
      console.error('❌ Connection failed:', healthError);
      return;
    }
    console.log('✅ Connected to database\n');

    // 2. ตรวจสอบ columns ของ leaves table
    console.log('2️⃣ Checking leaves table columns...');
    const { data: leaves, error: leavesError } = await supabaseAdmin
      .from('leaves')
      .select('*')
      .limit(1);
    
    if (leavesError) {
      console.error('❌ Cannot query leaves table:', leavesError);
      console.error('Error details:', JSON.stringify(leavesError, null, 2));
      return;
    }

    if (leaves && leaves.length > 0) {
      console.log('✅ Can query leaves table');
      console.log('Available columns:', Object.keys(leaves[0]));
      console.log('');
      
      // ตรวจสอบว่ามี selected_dates หรือไม่
      if ('selected_dates' in leaves[0]) {
        console.log('✅ Column "selected_dates" EXISTS in result!');
        console.log('Value:', leaves[0].selected_dates);
      } else {
        console.log('❌ Column "selected_dates" NOT FOUND in result!');
        console.log('This means PostgREST schema cache is outdated');
      }
    } else {
      console.log('⚠️  No data in leaves table');
    }
    console.log('');

    // 3. ทดสอบ INSERT ด้วย selected_dates
    console.log('3️⃣ Testing INSERT with selected_dates...');
    
    // Get user และ leave type
    const { data: users } = await supabaseAdmin.from('users').select('id').limit(1);
    const { data: leaveTypes } = await supabaseAdmin.from('leave_types').select('id').limit(1);
    
    if (!users || !leaveTypes) {
      console.error('❌ No users or leave types found');
      return;
    }

    const testData = {
      user_id: users[0].id,
      leave_type_id: leaveTypes[0].id,
      start_date: '2026-02-01',
      end_date: '2026-02-02',
      total_days: 2,
      selected_dates: ['2026-02-01', '2026-02-02'],
      reason: 'Test connection',
      status: 'pending',
      current_approval_level: 1
    };

    console.log('Inserting test data...');
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('leaves')
      .insert(testData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ INSERT failed!');
      console.error('Error code:', insertError.code);
      console.error('Error message:', insertError.message);
      console.error('');
      console.log('🔴 THIS IS THE PROBLEM:');
      console.log('PostgREST API does not recognize "selected_dates" column');
      console.log('');
      console.log('✅ Solution:');
      console.log('Go to Supabase Dashboard → Settings → General');
      console.log('Click "Restart project" (NOT Fast database reboot)');
      console.log('Wait 2-3 minutes for project to restart');
      console.log('Then try again');
    } else {
      console.log('✅ INSERT successful!');
      console.log('Inserted data:', inserted);
      console.log('');
      console.log('🎉 Everything works! Schema cache is updated!');
      
      // ลบทิ้ง
      await supabaseAdmin.from('leaves').delete().eq('id', inserted.id);
      console.log('✅ Test data cleaned up');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testConnection();
