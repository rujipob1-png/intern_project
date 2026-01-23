import { supabaseAdmin } from './src/config/supabase.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('🚀 Starting migration to 4-level approval system...\n');

    // 1. Create departments table
    console.log('📁 Creating departments table...');
    const { error: deptTableError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS departments (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          department_code VARCHAR(20) UNIQUE NOT NULL,
          department_name VARCHAR(100) NOT NULL,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (deptTableError) {
      console.log('ℹ️  Departments table already exists or using direct SQL...');
    }

    // 2. Insert departments data
    console.log('📝 Inserting departments...');
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
        .upsert(dept, { onConflict: 'department_code', ignoreDuplicates: true });
      
      if (!error) {
        console.log(`  ✓ ${dept.department_name}`);
      }
    }

    // 3. Add department_id column to users
    console.log('\n👥 Updating users table...');
    // This might fail if column exists - that's ok
    await supabaseAdmin.rpc('exec_sql', {
      sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);'
    });
    console.log('  ✓ Added department_id column');

    // 4. Insert new roles
    console.log('\n🎭 Updating roles...');
    
    const newRoles = [
      { role_name: 'central_office_staff', role_level: 3, description: 'พนักงานกองกลาง - ตรวจสอบเอกสารและส่งต่อ (ระดับ 2)' },
      { role_name: 'central_office_head', role_level: 4, description: 'หัวหน้ากองกลาง - อนุมัติคำขอลาระดับ 3' }
    ];

    for (const role of newRoles) {
      const { error } = await supabaseAdmin
        .from('roles')
        .upsert(role, { onConflict: 'role_name', ignoreDuplicates: true });
      
      if (!error) {
        console.log(`  ✓ ${role.role_name} (Level ${role.role_level})`);
      }
    }

    // 5. Update existing roles
    await supabaseAdmin
      .from('roles')
      .update({ 
        role_level: 2, 
        description: 'ผู้อำนวยการกอง - อนุมัติคำขอลาของพนักงานในกองตนเอง (ระดับ 1)' 
      })
      .eq('role_name', 'director');
    console.log('  ✓ Updated director role');

    await supabaseAdmin
      .from('roles')
      .update({ 
        role_level: 5, 
        description: 'ผู้บริหารสูงสุด - อนุมัติขั้นสุดท้าย (ระดับ 4)' 
      })
      .eq('role_name', 'admin');
    console.log('  ✓ Updated admin role');

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📊 Summary:');
    
    // Show summary
    const { data: depts } = await supabaseAdmin.from('departments').select('*');
    console.log(`   Departments: ${depts?.length || 0}`);
    
    const { data: roles } = await supabaseAdmin.from('roles').select('*').order('role_level');
    console.log(`   Roles: ${roles?.length || 0}`);
    if (roles) {
      roles.forEach(r => console.log(`     - ${r.role_name} (Level ${r.role_level})`));
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error:', error.message);
    process.exit(1);
  });
