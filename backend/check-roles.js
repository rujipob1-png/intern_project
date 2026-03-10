import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';
const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const roles = await s.from('roles').select('id, role_name, role_level, description');
const users = await s.from('users').select('employee_code, first_name, last_name, department, role_id');

const roleMap = {};
roles.data.forEach(r => { roleMap[r.id] = r.role_name; });

console.log('=== Roles ในระบบ ===');
roles.data.sort((a,b) => a.role_level - b.role_level).forEach(r => {
  const count = users.data.filter(u => u.role_id === r.id).length;
  console.log(`  Level ${r.role_level} | ${r.role_name.padEnd(25)} | ${r.description.padEnd(20)} | ${count} คน`);
});

console.log('\n=== Users ต่อ role ===');
roles.data.sort((a,b) => a.role_level - b.role_level).forEach(r => {
  const roleUsers = users.data.filter(u => u.role_id === r.id);
  console.log(`\n${r.role_name} (Level ${r.role_level}) — ${roleUsers.length} คน:`);
  roleUsers.forEach(u => {
    console.log(`  ${u.employee_code} | ${u.first_name} ${u.last_name} | ${u.department}`);
  });
});
