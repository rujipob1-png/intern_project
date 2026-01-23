import { supabaseAdmin } from './src/config/supabase.js';

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database...\n');

    // 1. Check if departments table exists and has data
    console.log('📁 Checking departments...');
    let { data: existingDepts, error: deptError } = await supabaseAdmin
      .from('departments')
      .select('*');

    if (deptError) {
      console.log('   Creating departments table via direct insert...');
    }

    if (!existingDepts || existingDepts.length === 0) {
      console.log('   Inserting departments...');
      
      const departments = [
        { department_code: 'IT', department_name: 'กองเทคโนโลยีสารสนเทศ', description: 'ดูแลระบบคอมพิวเตอร์และเทคโนโลยี' },
        { department_code: 'HR', department_name: 'กองทรัพยากรบุคคล', description: 'จัดการด้านบุคลากรและสวัสดิการ' },
        { department_code: 'FIN', department_name: 'กองการเงินและบัญชี', description: 'จัดการด้านการเงินและบัญชี' },
        { department_code: 'ADMIN', department_name: 'กองบริหารทั่วไป', description: 'งานบริหารและประสานงานทั่วไป' },
        { department_code: 'CENTRAL', department_name: 'กองกลาง', description: 'กองอำนวยการและประสานงานกลาง' }
      ];

      for (const dept of departments) {
        const { error } = await supabaseAdmin
          .from('departments')
          .insert(dept);
        
        if (!error) {
          console.log(`     ✓ ${dept.department_name}`);
        } else {
          console.log(`     ⚠️  ${dept.department_code}: ${error.message}`);
        }
      }
    } else {
      console.log(`   ✓ Already have ${existingDepts.length} departments`);
    }

    // 2. Verify roles
    console.log('\n🎭 Checking roles...');
    const { data: roles } = await supabaseAdmin
      .from('roles')
      .select('*')
      .order('role_level');
    
    if (roles) {
      console.log(`   Found ${roles.length} roles:`);
      roles.forEach(r => console.log(`     - ${r.role_name} (Level ${r.role_level})`));
    }

    // 3. Show final status
    console.log('\n📊 Database Status:');
    const { data: finalDepts } = await supabaseAdmin.from('departments').select('*');
    const { data: finalRoles } = await supabaseAdmin.from('roles').select('*');
    const { data: users } = await supabaseAdmin.from('users').select('*');
    
    console.log(`   Departments: ${finalDepts?.length || 0}`);
    console.log(`   Roles: ${finalRoles?.length || 0}`);
    console.log(`   Users: ${users?.length || 0}`);

    console.log('\n✅ Database setup complete!');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  }
}

setupDatabase()
  .then(() => {
    console.log('\n🎉 Ready to create sample users!');
    console.log('   Run: node create-sample-users.js');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error:', error.message);
    process.exit(1);
  });
