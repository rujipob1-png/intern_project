import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import https from 'https';
import http from 'http';

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
  status VARCHAR(20) DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id),
  review_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_registration_requests_status ON registration_requests(status);
CREATE INDEX IF NOT EXISTS idx_registration_requests_employee_code ON registration_requests(employee_code);
CREATE INDEX IF NOT EXISTS idx_registration_requests_created_at ON registration_requests(created_at DESC);
`;

// Use the Supabase REST SQL endpoint
const url = new URL(SUPABASE_URL + '/rest/v1/rpc/exec_sql');

async function runSQL() {
  console.log('Supabase URL:', SUPABASE_URL);
  console.log('Attempting to create table via multiple methods...');
  console.log('');

  // Method 1: Try pg_query via postgrest
  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Try using the SQL endpoint directly
  const apiUrl = SUPABASE_URL.replace('.supabase.co', '.supabase.co');
  const sqlUrl = apiUrl + '/rest/v1/rpc/';
  
  console.log('Method 1: Trying direct fetch to SQL API...');
  
  try {
    // Supabase has a /sql endpoint in newer versions
    const response = await fetch(SUPABASE_URL + '/rest/v1/', {
      method: 'GET',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': 'Bearer ' + SERVICE_ROLE_KEY,
      }
    });
    console.log('REST API status:', response.status);
    const text = await response.text();
    console.log('REST API response preview:', text.substring(0, 200));
  } catch (err) {
    console.log('Method 1 error:', err.message);
  }

  console.log('');
  console.log('Method 2: Trying database connection string...');
  
  // Extract project ref from URL
  const match = SUPABASE_URL.match(/https:\/\/([^.]+)\./);
  if (match) {
    const projectRef = match[1];
    console.log('Project ref:', projectRef);
    console.log('');
    console.log('To create the table, please go to:');
    console.log('https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
    console.log('');
    console.log('And paste the SQL from: database/create_registration_requests.sql');
  }
}

runSQL();
