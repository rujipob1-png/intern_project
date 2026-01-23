import axios from 'axios';

// Test API endpoint โดยตรง
async function testCreateLeave() {
  try {
    console.log('🧪 Testing create leave API...\n');

    // 1. Login ก่อน
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      employeeCode: 'EMP001',
      password: '123456'
    });

    if (!loginResponse.data.success) {
      console.error('❌ Login failed:', loginResponse.data);
      return;
    }

    const token = loginResponse.data.data.token;
    console.log('✅ Login successful\n');

    // 2. Get leave types
    console.log('2️⃣ Getting leave types...');
    const typesResponse = await axios.get('http://localhost:3000/api/leave-types', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const leaveTypes = typesResponse.data.data;
    console.log(`✅ Found ${leaveTypes.length} leave types`);
    console.log('Leave types:', leaveTypes.map(t => `${t.type_code}: ${t.type_name}`).join(', '));
    console.log('');

    // 3. ทดสอบสร้างคำขอลา
    console.log('3️⃣ Creating leave request...');
    const leaveData = {
      leaveTypeId: leaveTypes[0].id, // ใช้ประเภทแรก
      selectedDates: ['2026-01-25', '2026-01-26'],
      totalDays: 2,
      reason: 'ทดสอบระบบ',
      contactAddress: 'ที่บ้าน',
      contactPhone: '0812345678'
    };

    console.log('Request data:', JSON.stringify(leaveData, null, 2));

    const createResponse = await axios.post(
      'http://localhost:3000/api/leaves',
      leaveData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (createResponse.data.success) {
      console.log('\n✅ สร้างคำขอลาสำเร็จ!');
      console.log('Response:', JSON.stringify(createResponse.data, null, 2));
    } else {
      console.log('\n❌ สร้างคำขอลาไม่สำเร็จ');
      console.log('Response:', JSON.stringify(createResponse.data, null, 2));
    }

  } catch (error) {
    console.error('\n❌ Error occurred:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Message:', error.message);
    }
  }
}

testCreateLeave();
