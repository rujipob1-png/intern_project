import { supabaseAdmin } from './src/config/supabase.js';

async function createRegistrationTable() {
  console.log('Creating registration_requests table...\n');

  // Try using exec_sql RPC (same approach as migrate.js)
  const { error: rpcError } = await supabaseAdmin.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS registration_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_code VARCHAR(20) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        title VARCHAR(50),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        position VARCHAR(200),
        department_code VARCHAR(20),
        phone VARCHAR(20),
        email VARCHAR(255),
        status VARCHAR(20) DEFAULT 'pending',
        reviewed_by UUID REFERENCES users(id),
        review_note TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_registration_requests_status ON registration_requests(status);
      CREATE INDEX IF NOT EXISTS idx_registration_requests_employee_code ON registration_requests(employee_code);
      CREATE INDEX IF NOT EXISTS idx_registration_requests_created_at ON registration_requests(created_at DESC);
    `
  });

  if (rpcError) {
    console.log('RPC exec_sql returned error:', rpcError.message);
    console.log('Error code:', rpcError.code);
    console.log('');
    console.log('This may mean the exec_sql function does not exist in the database.');
    console.log('Attempting alternative approach...\n');

    // Alternative: Try using raw SQL via postgrest
    // First check if table was actually created despite error
    const { data, error: checkError } = await supabaseAdmin
      .from('registration_requests')
      .select('id')
      .limit(1);

    if (!checkError) {
      console.log('Table was actually created successfully!');
    } else {
      console.log('Table still does not exist.');
      console.log('');
      console.log('Please create it manually in the Supabase Dashboard SQL Editor:');
      console.log('https://supabase.com/dashboard/project/dyiogforukaqpbhwtggw/sql/new');
    }
  } else {
    console.log('Table created successfully via exec_sql RPC!');
  }

  // Verify
  const { data: verifyData, error: verifyError } = await supabaseAdmin
    .from('registration_requests')
    .select('id')
    .limit(1);

  if (!verifyError) {
    console.log('\nVerification: registration_requests table EXISTS');
  } else {
    console.log('\nVerification: Table does NOT exist yet. Error:', verifyError.code);
  }

  process.exit(0);
}

createRegistrationTable();
