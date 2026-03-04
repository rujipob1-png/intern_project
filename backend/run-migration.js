import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const sql = `
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
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES users(id),
  review_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
`;

const indexSql = `
CREATE INDEX IF NOT EXISTS idx_registration_requests_status ON registration_requests(status);
CREATE INDEX IF NOT EXISTS idx_registration_requests_employee_code ON registration_requests(employee_code);
CREATE INDEX IF NOT EXISTS idx_registration_requests_created_at ON registration_requests(created_at DESC);
`;

async function runMigration() {
  // Extract project ref
  const match = SUPABASE_URL.match(/https:\/\/([^.]+)\./);
  const projectRef = match ? match[1] : null;
  
  if (!projectRef) {
    console.log('Could not extract project ref from URL');
    process.exit(1);
  }
  
  console.log('Project:', projectRef);
  console.log('Running SQL migration...\n');

  // Use Supabase Management API SQL endpoint  
  // POST https://<project_ref>.supabase.co/rest/v1/rpc/<function_name>
  // Or use the pg_net extension if available

  // Try the Supabase SQL API (available via service role)
  const sqlApiUrl = `${SUPABASE_URL}/rest/v1/rpc/`;
  
  // Method: Use the direct Postgres connection via Supabase's pg endpoint
  // Supabase exposes a /pg endpoint for service role
  
  // Actually, the simplest way is to use the Supabase SQL endpoint
  const response = await fetch(`${SUPABASE_URL}/sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  console.log('Create table response status:', response.status);
  const text = await response.text();
  
  if (response.ok) {
    console.log('✅ Table created successfully!');
    
    // Now create indexes
    const idxResponse = await fetch(`${SUPABASE_URL}/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query: indexSql }),
    });
    
    if (idxResponse.ok) {
      console.log('✅ Indexes created successfully!');
    } else {
      console.log('Index creation status:', idxResponse.status);
      console.log(await idxResponse.text());
    }
  } else {
    console.log('Response:', text);
    console.log('\n❌ Could not create table via SQL API.');
    console.log('Please run the SQL manually in Supabase Dashboard > SQL Editor:');
    console.log(`https://supabase.com/dashboard/project/${projectRef}/sql/new`);
    console.log('\nSQL to run:');
    console.log(sql);
    console.log(indexSql);
  }
}

runMigration().catch(console.error);
