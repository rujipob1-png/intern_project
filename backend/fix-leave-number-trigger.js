import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixTrigger() {
  const sql = `
    CREATE OR REPLACE FUNCTION generate_leave_number()
    RETURNS TRIGGER AS $$
    DECLARE
        current_year VARCHAR(4);
        current_month VARCHAR(2);
        sequence_num INTEGER;
        year_month VARCHAR(6);
    BEGIN
        current_year := TO_CHAR(NOW(), 'YYYY');
        current_month := TO_CHAR(NOW(), 'MM');
        year_month := current_year || current_month;
        
        -- ใช้ MAX sequence number แทน COUNT เพื่อป้องกัน duplicate เมื่อมีการลบรายการ
        SELECT COALESCE(
            MAX(
                CAST(
                    SUBSTRING(leave_number FROM 'LV-' || year_month || '-([0-9]+)') 
                    AS INTEGER
                )
            ), 0
        ) + 1 INTO sequence_num
        FROM leaves
        WHERE leave_number LIKE 'LV-' || year_month || '-%';
        
        -- สร้างเลขที่เอกสาร: LV-YYYYMM-XXXX
        NEW.leave_number := 'LV-' || year_month || '-' || LPAD(sequence_num::TEXT, 4, '0');
        
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
      console.log('RPC error:', error.message);
      console.log('\n⚠️  Please run this SQL directly in Supabase SQL Editor:');
      console.log('='.repeat(60));
      console.log(sql);
      console.log('='.repeat(60));
    } else {
      console.log('✅ Trigger updated successfully!');
    }
  } catch (err) {
    console.log('Error:', err.message);
    console.log('\n⚠️  Please run this SQL directly in Supabase SQL Editor:');
    console.log('='.repeat(60));
    console.log(sql);
    console.log('='.repeat(60));
  }
}

fixTrigger();
