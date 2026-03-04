import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dyiogforukaqpbhwtggw.supabase.co',
  'sb_secret_pVA3raZB4r7oWRkWse894g_jvgjULFH'
);

// Check if hire_date column exists
const { data, error } = await supabase
  .from('registration_requests')
  .select('*')
  .limit(1);

if (data && data[0]) {
  console.log('Current columns:', Object.keys(data[0]).join(', '));
  if ('hire_date' in data[0]) {
    console.log('hire_date column already exists!');
  } else {
    console.log('hire_date column NOT found — needs to be added via SQL');
  }
} else {
  console.log('No data or error:', error?.message);
  // Check with empty table
  const { data: d2, error: e2 } = await supabase.rpc('exec_sql', { sql: 'SELECT column_name FROM information_schema.columns WHERE table_name = \'registration_requests\'' });
  console.log('RPC result:', d2, e2?.message);
}
