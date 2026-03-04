import { supabaseAdmin } from './src/config/supabase.js';

async function createTable() {
  // Check if table exists
  const { data, error } = await supabaseAdmin
    .from('registration_requests')
    .select('id')
    .limit(1);

  if (!error) {
    console.log('Table registration_requests already exists');
    process.exit(0);
  }

  console.log('Table does not exist. Code:', error.code);
  console.log('Please create it via Supabase Dashboard SQL Editor.');
  console.log('');
  console.log('Run the following SQL:');
  console.log('---');
  console.log(`
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
  `);
  console.log('---');
  process.exit(0);
}

createTable();
