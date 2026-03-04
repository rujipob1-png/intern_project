import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dyiogforukaqpbhwtggw.supabase.co',
  'sb_secret_pVA3raZB4r7oWRkWse894g_jvgjULFH'
);

// 1. Check pending registrations
const { data: regs, error: regErr } = await supabase
  .from('registration_requests')
  .select('*')
  .eq('status', 'pending');

console.log('=== Pending Registrations ===');
console.log(JSON.stringify(regs, null, 2));
if (regErr) console.log('Reg Error:', regErr.message);

// 2. Check departments
const { data: depts, error: deptErr } = await supabase
  .from('departments')
  .select('*');

console.log('\n=== Departments ===');
console.log(JSON.stringify(depts, null, 2));
if (deptErr) console.log('Dept Error:', deptErr.message);

// 3. Check users table columns
const { data: users } = await supabase.from('users').select('*').limit(1);
if (users && users[0]) {
  console.log('\n=== User Columns ===');
  console.log(Object.keys(users[0]).join(', '));
}

// 4. Try to simulate the approve flow
if (regs && regs.length > 0) {
  const reg = regs[0];
  console.log('\n=== Simulating approve for:', reg.employee_code, '===');
  
  // Check if employee_code already exists
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('employee_code', reg.employee_code)
    .single();
  console.log('Existing user:', existing);

  // Find department
  if (reg.department_code) {
    const { data: dept, error: dErr } = await supabase
      .from('departments')
      .select('id')
      .eq('department_code', reg.department_code)
      .single();
    console.log('Department lookup:', dept, dErr?.message);
  }

  // Get default role
  const { data: userRole } = await supabase
    .from('roles')
    .select('id')
    .eq('role_name', 'user')
    .single();
  console.log('Default role:', userRole);

  // Try insert
  const insertData = {
    employee_code: reg.employee_code,
    password_hash: reg.password_hash,
    title: reg.title,
    first_name: reg.first_name,
    last_name: reg.last_name,
    position: reg.position,
    department_id: null,
    phone: reg.phone,
    email: reg.email,
    role_id: userRole?.id,
    is_active: true,
    sick_leave_balance: 60,
    personal_leave_balance: 15,
    vacation_leave_balance: 10,
    vacation_carryover: 0,
  };
  console.log('\nInsert data:', JSON.stringify(insertData, null, 2));

  const { data: newUser, error: createErr } = await supabase
    .from('users')
    .insert(insertData)
    .select()
    .single();
  
  if (createErr) {
    console.log('\n!!! CREATE ERROR !!!:', createErr.message);
    console.log('Details:', JSON.stringify(createErr, null, 2));
  } else {
    console.log('\nCreated user:', newUser.id);
    // Clean up - delete the test user
    await supabase.from('users').delete().eq('id', newUser.id);
    console.log('Cleaned up test user');
  }
}
