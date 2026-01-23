import { supabaseAdmin } from './src/config/supabase.js';
import bcrypt from 'bcrypt';

async function createSampleUsers() {
  try {
    console.log('👥 Creating sample users for testing...\n');

    // Get role and department IDs
    const { data: roles, error: rolesError } = await supabaseAdmin.from('roles').select('*');
    const { data: departments, error: deptsError } = await supabaseAdmin.from('departments').select('*');

    if (rolesError) {
      console.error('❌ Failed to fetch roles:', rolesError);
      throw rolesError;
    }

    if (deptsError) {
      console.error('❌ Failed to fetch departments:', deptsError);
      throw deptsError;
    }

    if (!roles || roles.length === 0) {
      throw new Error('No roles found in database');
    }

    if (!departments || departments.length === 0) {
      throw new Error('No departments found in database. Run update_departments.sql first!');
    }

    const roleMap = {};
    roles.forEach(r => roleMap[r.role_name] = r.id);

    const deptMap = {};
    departments.forEach(d => deptMap[d.department_code] = d.id);

    console.log(`Found ${roles.length} roles and ${departments.length} departments\n`);

    // Password hash for "123456"
    const passwordHash = await bcrypt.hash('123456', 10);

    const users = [
      // กลุ่มงานเทคโนโลยีสารสนเทศ (KTS)
      {
        employee_code: 'EMP001',
        password_hash: passwordHash,
        title: 'นาย',
        first_name: 'สมชาย',
        last_name: 'ใจดี',
        position: 'นักวิเคราะห์ระบบ',
        phone: '081-111-1001',
        role_id: roleMap.user,
        department_id: deptMap['KTS-DEV1']
      },
      {
        employee_code: 'EMP002',
        password_hash: passwordHash,
        title: 'นางสาว',
        first_name: 'สมหญิง',
        last_name: 'รักงาน',
        position: 'โปรแกรมเมอร์',
        phone: '081-111-1002',
        role_id: roleMap.user,
        department_id: deptMap['KTS-DEV2']
      },
      {
        employee_code: 'DIR001',
        password_hash: passwordHash,
        title: 'นาย',
        first_name: 'วิชัย',
        last_name: 'เทคโนโลยี',
        position: 'ผู้อำนวยการกลุ่มงานเทคโนโลยีสารสนเทศ',
        phone: '081-111-1000',
        role_id: roleMap.director,
        department_id: deptMap.KTS
      },
      
      // กลุ่มงานบริหารจัดการ (KBJ)
      {
        employee_code: 'EMP003',
        password_hash: passwordHash,
        title: 'นาง',
        first_name: 'จินตนา',
        last_name: 'ดูแลดี',
        position: 'เจ้าหน้าที่บุคลากร',
        phone: '081-222-2001',
        role_id: roleMap.user,
        department_id: deptMap['KBJ-HR']
      },
      {
        employee_code: 'DIR002',
        password_hash: passwordHash,
        title: 'นาง',
        first_name: 'สุภาพร',
        last_name: 'จัดการดี',
        position: 'ผู้อำนวยการกลุ่มงานบริหารจัดการ',
        phone: '081-222-2000',
        role_id: roleMap.director,
        department_id: deptMap.KBJ
      },
      
      // กลุ่มงานติดตามประเมินผล (KTP)
      {
        employee_code: 'EMP004',
        password_hash: passwordHash,
        title: 'นาย',
        first_name: 'ประเสริฐ',
        last_name: 'มานะ',
        position: 'นักวิเคราะห์ระบบ',
        phone: '081-333-3001',
        role_id: roleMap.user,
        department_id: deptMap['KTP-DEV']
      },
      {
        employee_code: 'DIR003',
        password_hash: passwordHash,
        title: 'นาย',
        first_name: 'อนันต์',
        last_name: 'ติดตาม',
        position: 'ผู้อำนวยการกลุ่มงานติดตามประเมินผล',
        phone: '081-333-3000',
        role_id: roleMap.director,
        department_id: deptMap.KTP
      },
      
      // กลุ่มงานโครงสร้างพื้นฐาน (KKS) - สำหรับ Central Office Staff
      {
        employee_code: 'CTR001',
        password_hash: passwordHash,
        title: 'นางสาว',
        first_name: 'พิมพ์ใจ',
        last_name: 'ตรวจสอบ',
        position: 'เจ้าหน้าที่ตรวจสอบเอกสาร',
        phone: '081-444-4001',
        role_id: roleMap.central_office_staff,
        department_id: deptMap['KKS-ADMIN']
      },
      {
        employee_code: 'CTR002',
        password_hash: passwordHash,
        title: 'นาง',
        first_name: 'สุดา',
        last_name: 'รอบคอบ',
        position: 'หัวหน้ากลุ่มงานโครงสร้างพื้นฐาน',
        phone: '081-444-4000',
        role_id: roleMap.central_office_head,
        department_id: deptMap.KKS
      },
      
      // สำนักงานผู้บริหาร
      {
        employee_code: 'ADMIN001',
        password_hash: passwordHash,
        title: 'นาย',
        first_name: 'ประสิทธิ์',
        last_name: 'ผู้นำองค์กร',
        position: 'ผู้อำนวยการสูงสุด',
        phone: '081-000-0001',
        role_id: roleMap.admin,
        department_id: deptMap.EXECUTIVE
      }
    ];

    console.log('Creating users...');
    for (const user of users) {
      const { error } = await supabaseAdmin
        .from('users')
        .upsert(user, { onConflict: 'employee_code', ignoreDuplicates: false });

      if (error) {
        console.log(`  ⚠️  ${user.employee_code} - ${error.message}`);
      } else {
        console.log(`  ✓ ${user.employee_code} - ${user.first_name} ${user.last_name} (${user.position})`);
      }
    }

    console.log('\n✅ Sample users created!');
    console.log('\n🔑 Login credentials (all users):');
    console.log('   Password: 123456\n');
    console.log('📝 Test accounts for 4-level approval:');
    console.log('   👤 User:           EMP001 (สมชาย ใจดี - กทส.)');
    console.log('   📋 Director:       DIR001 (วิชัย เทคโนโลยี - กทส.)');
    console.log('   📄 Central Staff:  CTR001 (พิมพ์ใจ ตรวจสอบ - Level 2)');
    console.log('   👔 Central Head:   CTR002 (สุดา รอบคอบ - Level 3)');
    console.log('   ⚡ Admin:          ADMIN001 (ประสิทธิ์ ผู้นำองค์กร - Level 4)\n');
    console.log('🎯 Test flow:');
    console.log('   1. Login EMP001 → สร้างคำขอลา');
    console.log('   2. Login DIR001 → อนุมัติ (ส่งต่อ CTR001)');
    console.log('   3. Login CTR001 → ตรวจเอกสาร (ส่งต่อ CTR002)');
    console.log('   4. Login CTR002 → อนุมัติ (ส่งต่อ ADMIN001)');
    console.log('   5. Login ADMIN001 → อนุมัติขั้นสุดท้าย (หักวันลา)');

  } catch (error) {
    console.error('❌ Failed to create sample users:', error);
    throw error;
  }
}

createSampleUsers()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error:', error.message);
    process.exit(1);
  });
