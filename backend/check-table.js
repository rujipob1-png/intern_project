import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const s = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function check() {
  const { data, error } = await s
    .from('registration_requests')
    .select('id')
    .limit(1);

  if (error) {
    console.log('ERROR:', error.message);
    console.log('CODE:', error.code);
  } else {
    console.log('OK - table exists, rows:', data.length);
  }
  process.exit(0);
}

check();
