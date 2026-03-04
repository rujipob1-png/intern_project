import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

// Extract project ref from Supabase URL
const match = process.env.SUPABASE_URL.match(/https:\/\/([^.]+)\./);
const projectRef = match ? match[1] : null;

// Supabase direct connection
// Password is the database password (same as service role key for direct connection)
const connectionString = `postgresql://postgres.${projectRef}:${process.env.SUPABASE_SERVICE_ROLE_KEY}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`;

// Alternative: Try transaction mode pooler
const connectionString2 = `postgresql://postgres.${projectRef}:${process.env.SUPABASE_SERVICE_ROLE_KEY}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`;

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

CREATE INDEX IF NOT EXISTS idx_registration_requests_status ON registration_requests(status);
CREATE INDEX IF NOT EXISTS idx_registration_requests_employee_code ON registration_requests(employee_code);
CREATE INDEX IF NOT EXISTS idx_registration_requests_created_at ON registration_requests(created_at DESC);
`;

async function tryConnect(connStr, label) {
  console.log(`Trying ${label}...`);
  const client = new pg.Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log(`✅ Connected via ${label}`);
    const result = await client.query(sql);
    console.log('✅ Migration completed!');
    
    // Verify
    const check = await client.query("SELECT table_name FROM information_schema.tables WHERE table_name = 'registration_requests'");
    console.log('Table exists:', check.rows.length > 0);
    
    await client.end();
    return true;
  } catch (err) {
    console.log(`❌ ${label} failed:`, err.message);
    try { await client.end(); } catch(e) {}
    return false;
  }
}

async function main() {
  console.log('Project ref:', projectRef);
  console.log('');
  
  // Try session mode first
  let ok = await tryConnect(connectionString, 'session mode (6543)');
  if (!ok) {
    ok = await tryConnect(connectionString2, 'transaction mode (5432)');
  }
  
  if (!ok) {
    console.log('\n❌ Could not connect to database. Please run the SQL manually:');
    console.log(`https://supabase.com/dashboard/project/${projectRef}/sql/new`);
    console.log('\n' + sql);
  }
}

main().catch(console.error);
