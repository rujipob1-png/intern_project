import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://bxwqnhmqfvvxlxfomydh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4d3FuaG1xZnZ2eGx4Zm9teWRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODMyNzk3MSwiZXhwIjoyMDYzOTAzOTcxfQ.BPSChtpTy6M6AxFVJG3EhNnt6OYE6L3K9O71Z4YWxh8'
);

async function updateUserRole() {
  // Get central_office_staff role ID
  const { data: role, error: roleError } = await supabase
    .from('roles')
    .select('id')
    .eq('role_name', 'central_office_staff')
    .single();

  if (roleError || !role) {
    console.log('Error getting role:', roleError?.message || 'Role not found');
    process.exit(1);
  }

  console.log('Found central_office_staff role ID:', role.id);

  // Update user 51417 to central_office_staff
  const { error: updateError } = await supabase
    .from('users')
    .update({
      role_id: role.id,
      position: 'หัวหน้าฝ่ายบริหารทั่วไป'
    })
    .eq('employee_code', '51417');

  if (updateError) {
    console.log('Error updating user:', updateError.message);
    process.exit(1);
  }

  console.log('Successfully updated user 51417 to central_office_staff role!');

  // Verify the update
  const { data: user } = await supabase
    .from('users')
    .select('employee_code, first_name, last_name, position, roles(role_name)')
    .eq('employee_code', '51417')
    .single();

  console.log('Verification:', JSON.stringify(user, null, 2));
  process.exit(0);
}

updateUserRole();
