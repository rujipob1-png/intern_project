import { supabaseAdmin } from './src/config/supabase.js';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function resetAndSetup() {
  try {
    console.log('🚀 Starting database reset and setup...\n');

    // ลบข้อมูลเก่าทั้งหมด
    console.log('🗑️  Clearing old data...');
    
    const tablesToClear = ['approvals', 'leave_history', 'leaves', 'users', 'leave_types', 'roles'];
    for (const table of tablesToClear) {
      const { error } = await supabaseAdmin.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (!error) {
        console.log(`  ✓ Cleared ${table}`);
      }
    }

    // สร้างข้อมูล Roles
    console.log('\n🎭 Creating roles...');
    const roles = [
      { role_name: 'user', role_level: 1, description: 'พนักงานทั่วไป - ยื่นคำขอลา' },
      { role_name: 'director', role_level: 2, description: 'ผู้อำนวยการกอง - อนุมัติคำขอลาของพนักงานในกองตนเอง (ระดับ 1)' },
      { role_name: 'central_office_staff', role_level: 3, description: 'พนักงานกองกลาง - ตรวจสอบเอกสารและส่งต่อ (ระดับ 2)' },
      { role_name: 'central_office_head', role_level: 4, description: 'หัวหน้ากองกลาง - อนุมัติคำขอลาระดับ 3' },
      { role_name: 'admin', role_level: 5, description: 'ผู้บริหารสูงสุด - อนุมัติขั้นสุดท้าย (ระดับ 4)' }
    ];

    for (const role of roles) {
      const { error } = await supabaseAdmin.from('roles').insert(role);
      if (!error) {
        console.log(`  ✓ ${role.role_name} (Level ${role.role_level})`);
      }
    }

    // สร้างข้อมูล Leave Types
    console.log('\n📋 Creating leave types...');
    const leaveTypes = [
      { type_code: 'sick', type_name: 'ลาป่วย', description: 'ลาเนื่องจากเจ็บป่วย ไม่สบาย', requires_document: true, max_days_per_year: 30, is_paid: true },
      { type_code: 'personal', type_name: 'ลากิจส่วนตัว', description: 'ลาเพื่อธุระส่วนตัว', requires_document: false, max_days_per_year: 3, is_paid: true },
      { type_code: 'vacation', type_name: 'ลาพักผ่อน', description: 'ลาพักผ่อนประจำปี', requires_document: false, max_days_per_year: 10, is_paid: true },
      { type_code: 'maternity', type_name: 'ลาคลอดบุตร', description: 'ลาเพื่อคลอดบุตร สำหรับข้าราชการหญิง', requires_document: true, max_days_per_year: 90, is_paid: true },
      { type_code: 'ordination', type_name: 'ลาอุปสมบท', description: 'ลาเพื่ออุปสมบทเป็นพระภิกษุในพระพุทธศาสนา', requires_document: false, max_days_per_year: 120, is_paid: true },
      { type_code: 'hajj', type_name: 'ลาประกอบพิธีฮัจย์', description: 'ลาเพื่อประกอบพิธีฮัจย์ ศาสนาอิสลาม', requires_document: false, max_days_per_year: null, is_paid: true },
      { type_code: 'military', type_name: 'ลาเข้ารับการตรวจเลือก', description: 'ลาเพื่อเข้ารับการตรวจเลือกเข้ารับราชการทหาร', requires_document: false, max_days_per_year: null, is_paid: true },
      { type_code: 'late', type_name: 'มาสาย', description: 'บันทึกการมาทำงานสาย', requires_document: false, max_days_per_year: null, is_paid: true },
      { type_code: 'absent', type_name: 'ขาดราชการ', description: 'ขาดราชการโดยไม่ได้รับอนุญาต', requires_document: false, max_days_per_year: null, is_paid: false }
    ];

    for (const leaveType of leaveTypes) {
      const { error } = await supabaseAdmin.from('leave_types').insert(leaveType);
      if (!error) {
        console.log(`  ✓ ${leaveType.type_name}`);
      }
    }

    // สร้างข้อมูล Users
    console.log('\n👥 Creating sample users...');
    
    // Get role IDs
    const { data: rolesData } = await supabaseAdmin.from('roles').select('*');
    const roleMap = {};
    rolesData.forEach(r => roleMap[r.role_name] = r.id);

    const passwordHash = await bcrypt.hash('123456', 10);

    const users = [
      // Users
      {
        employee_code: 'EMP001',
        password_hash: passwordHash,
        title: 'นาย',
        first_name: 'สมชาย',
        last_name: 'ใจดี',
        position: 'นักวิเคราะห์ระบบ',
        department: 'กองเทคโนโลยีสารสนเทศ',
        phone: '081-111-1001',
        role_id: roleMap['user'],
        sick_leave_balance: 30,
        personal_leave_balance: 3,
        vacation_leave_balance: 10
      },
      {
        employee_code: 'EMP002',
        password_hash: passwordHash,
        title: 'นางสาว',
        first_name: 'สมหญิง',
        last_name: 'รักงาน',
        position: 'โปรแกรมเมอร์',
        department: 'กองเทคโนโลยีสารสนเทศ',
        phone: '081-111-1002',
        role_id: roleMap['user'],
        sick_leave_balance: 30,
        personal_leave_balance: 3,
        vacation_leave_balance: 10
      },
      {
        employee_code: 'EMP003',
        password_hash: passwordHash,
        title: 'นาง',
        first_name: 'จินตนา',
        last_name: 'ดูแลดี',
        position: 'เจ้าหน้าที่ทรัพยากรบุคคล',
        department: 'กองทรัพยากรบุคคล',
        phone: '081-222-2001',
        role_id: roleMap['user'],
        sick_leave_balance: 30,
        personal_leave_balance: 3,
        vacation_leave_balance: 10
      },
      // Directors
      {
        employee_code: 'DIR001',
        password_hash: passwordHash,
        title: 'นาย',
        first_name: 'วิชัย',
        last_name: 'เทคโนโลยี',
        position: 'ผู้อำนวยการกองเทคโนโลยีสารสนเทศ',
        department: 'กองเทคโนโลยีสารสนเทศ',
        phone: '081-111-1000',
        role_id: roleMap['director'],
        sick_leave_balance: 30,
        personal_leave_balance: 3,
        vacation_leave_balance: 10
      },
      {
        employee_code: 'DIR002',
        password_hash: passwordHash,
        title: 'นาง',
        first_name: 'สุภาพร',
        last_name: 'จัดการดี',
        position: 'ผู้อำนวยการกองทรัพยากรบุคคล',
        department: 'กองทรัพยากรบุคคล',
        phone: '081-222-2000',
        role_id: roleMap['director'],
        sick_leave_balance: 30,
        personal_leave_balance: 3,
        vacation_leave_balance: 10
      },
      // Central Office
      {
        employee_code: 'CTR001',
        password_hash: passwordHash,
        title: 'นางสาว',
        first_name: 'พิมพ์ใจ',
        last_name: 'ตรวจสอบ',
        position: 'เจ้าหน้าที่กองกลาง',
        department: 'กองกลาง',
        phone: '081-444-4001',
        role_id: roleMap['central_office_staff'],
        sick_leave_balance: 30,
        personal_leave_balance: 3,
        vacation_leave_balance: 10
      },
      {
        employee_code: 'CTR002',
        password_hash: passwordHash,
        title: 'นาง',
        first_name: 'สุดา',
        last_name: 'รอบคอบ',
        position: 'หัวหน้ากองกลาง',
        department: 'กองกลาง',
        phone: '081-444-4000',
        role_id: roleMap['central_office_head'],
        sick_leave_balance: 30,
        personal_leave_balance: 3,
        vacation_leave_balance: 10
      },
      // Admin
      {
        employee_code: 'ADMIN001',
        password_hash: passwordHash,
        title: 'นาย',
        first_name: 'ประสิทธิ์',
        last_name: 'ผู้นำองค์กร',
        position: 'ผู้อำนวยการสูงสุด',
        department: 'สำนักงานผู้อำนวยการ',
        phone: '081-000-0001',
        role_id: roleMap['admin'],
        sick_leave_balance: 30,
        personal_leave_balance: 3,
        vacation_leave_balance: 10
      }
    ];

    for (const user of users) {
      const { error } = await supabaseAdmin.from('users').insert(user);
      if (!error) {
        console.log(`  ✓ ${user.employee_code} - ${user.title}${user.first_name} ${user.last_name}`);
      } else {
        console.log(`  ❌ ${user.employee_code}: ${error.message}`);
      }
    }

    // สร้างข้อมูลตัวอย่างการลา
    console.log('\n📝 Creating sample leave requests...');
    
    const { data: usersData } = await supabaseAdmin.from('users').select('id, employee_code');
    const { data: leaveTypesData } = await supabaseAdmin.from('leave_types').select('id, type_code');
    
    const userMap = {};
    usersData.forEach(u => userMap[u.employee_code] = u.id);
    
    const leaveTypeMap = {};
    leaveTypesData.forEach(lt => leaveTypeMap[lt.type_code] = lt.id);

    const sampleLeaves = [
      {
        user_id: userMap['EMP001'],
        leave_type_id: leaveTypeMap['vacation'],
        start_date: '2026-01-20',
        end_date: '2026-01-22',
        total_days: 3,
        reason: 'ลาพักผ่อนตามแผนที่วางไว้',
        contact_address: '123 ถ.สุขุมวิท กรุงเทพฯ',
        contact_phone: '081-111-1001',
        status: 'pending',
        current_approval_level: 1
      },
      {
        user_id: userMap['EMP003'],
        leave_type_id: leaveTypeMap['sick'],
        start_date: '2026-01-19',
        end_date: '2026-01-19',
        total_days: 1,
        reason: 'ป่วยเป็นไข้หวัด',
        contact_address: '456 ถ.พระราม 4 กรุงเทพฯ',
        contact_phone: '081-222-2001',
        status: 'pending',
        current_approval_level: 1
      }
    ];

    for (const leave of sampleLeaves) {
      const { error } = await supabaseAdmin.from('leaves').insert(leave);
      if (error) {
        console.log(`  ⚠️  Failed to create leave: ${error.message}`);
      } else {
        console.log(`  ✓ Created leave request`);
      }
    }

    console.log('\n✅ Database setup completed successfully!\n');
    console.log('📊 Summary:');
    console.log('   Roles: 5 (user, director, central_office_staff, central_office_head, admin)');
    console.log('   Leave Types: 9 (ป่วย, กิจ, พักผ่อน, คลอด, อุปสมบท, ฮัจย์, ทหาร, มาสาย, ขาด)');
    console.log('   Users: 8 (3 employees, 2 directors, 2 central office, 1 admin)');
    console.log('   Sample Leaves: 2\n');
    console.log('🎉 You can now login with:');
    console.log('   👤 User:           EMP001 / 123456');
    console.log('   👔 Director:       DIR001 / 123456');
    console.log('   📋 Central Staff:  CTR001 / 123456');
    console.log('   👨‍💼 Central Head:   CTR002 / 123456');
    console.log('   👑 Admin:          ADMIN001 / 123456\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetAndSetup();
