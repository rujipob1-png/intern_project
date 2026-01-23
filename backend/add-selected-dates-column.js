import { supabaseAdmin } from './src/config/supabase.js';

async function addSelectedDatesColumn() {
  try {
    console.log('🔧 Adding selected_dates column to leaves table...\n');

    // วิธีที่ 1: ลองใช้ rpc (ถ้า Supabase รองรับ)
    const sql = `
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 
              FROM information_schema.columns 
              WHERE table_name = 'leaves' 
              AND column_name = 'selected_dates'
          ) THEN
              ALTER TABLE leaves ADD COLUMN selected_dates DATE[];
              
              UPDATE leaves 
              SET selected_dates = ARRAY(
                  SELECT generate_series(start_date, end_date, '1 day'::interval)::date
              )
              WHERE selected_dates IS NULL;
              
              RAISE NOTICE 'Column added successfully';
          END IF;
      END $$;
    `;

    // ลองเพิ่ม column ผ่าน raw SQL (ถ้า Supabase อนุญาต)
    try {
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql });
      if (error) {
        console.log('⚠️  Cannot use rpc method, trying direct approach...');
      } else {
        console.log('✅ Column added via RPC\n');
        return;
      }
    } catch (e) {
      console.log('⚠️  RPC method not available, trying direct test...');
    }

    // วิธีที่ 2: ทดสอบว่า column มีอยู่แล้วหรือไม่
    const { data: testData, error: testError } = await supabaseAdmin
      .from('leaves')
      .select('selected_dates')
      .limit(1);

    if (testError) {
      if (testError.message.includes('selected_dates')) {
        console.log('❌ Column selected_dates does not exist in database');
        console.log('\n📋 Please run this SQL manually in Supabase SQL Editor:');
        console.log('─'.repeat(60));
        console.log(sql);
        console.log('─'.repeat(60));
        console.log('\nSteps:');
        console.log('1. Go to Supabase Dashboard → SQL Editor');
        console.log('2. Create a new query');
        console.log('3. Copy and paste the SQL above');
        console.log('4. Click "Run" or press Ctrl+Enter\n');
        process.exit(1);
      } else {
        throw testError;
      }
    } else {
      console.log('✅ Column selected_dates already exists!\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n⚠️  Please add the column manually using SQL Editor in Supabase Dashboard');
    process.exit(1);
  }
}

addSelectedDatesColumn();
