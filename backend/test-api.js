/**
 * ============================================
 * ระบบทดสอบ API - ระบบการลาออนไลน์
 * ============================================
 * วิธีใช้: node test-api.js
 */

const BASE_URL = 'http://localhost:3000/api';

// Test credentials (ตามข้อมูลจริงใน update_real_structure.sql)
const TEST_USERS = {
  user: { employeeCode: '50790', password: '123456' },           // พนักงานทั่วไป (กสส.)
  director: { employeeCode: '51497', password: '123456' },       // ผอ.กยส. (director)
  centralStaff: { employeeCode: '51417', password: '123456' },   // หัวหน้าฝ่ายบริหารทั่วไป (central_office_staff)
  centralHead: { employeeCode: '51410', password: '123456' },    // ผอ.กอก. (central_office_head)
  admin: { employeeCode: '50001', password: '123456' }           // ผู้อำนวยการสำนัก (admin)
};

// Store tokens
let tokens = {};

// Colors for console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Helper functions
function log(type, message) {
  const icons = {
    success: `${colors.green}✓${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
    info: `${colors.blue}ℹ${colors.reset}`,
    warning: `${colors.yellow}⚠${colors.reset}`
  };
  console.log(`${icons[type]} ${message}`);
}

async function fetchAPI(endpoint, options = {}) {
  try {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    const data = await response.json();
    return { status: response.status, data, ok: response.ok };
  } catch (error) {
    return { status: 0, data: null, ok: false, error: error.message };
  }
}

// ============================================
// TEST CASES
// ============================================

const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function recordTest(name, passed, message = '') {
  testResults.tests.push({ name, passed, message });
  if (passed) {
    testResults.passed++;
    log('success', `${name}`);
  } else {
    testResults.failed++;
    log('error', `${name} - ${message}`);
  }
}

// ============================================
// 1. Authentication Tests
// ============================================
async function testAuthentication() {
  console.log('\n' + colors.blue + '=== 1. ทดสอบ Authentication ===' + colors.reset);

  // Test 1.1: Login with valid credentials
  for (const [role, creds] of Object.entries(TEST_USERS)) {
    const result = await fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify(creds)
    });
    
    if (result.ok && result.data?.data?.token) {
      tokens[role] = result.data.data.token;
      recordTest(`Login ${role} (${creds.employeeCode})`, true);
    } else {
      recordTest(`Login ${role} (${creds.employeeCode})`, false, result.data?.message || 'No token returned');
    }
  }

  // Test 1.2: Login with invalid password
  const invalidResult = await fetchAPI('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ employeeCode: '50790', password: 'wrongpassword' })
  });
  recordTest('Login with wrong password (should fail)', !invalidResult.ok);

  // Test 1.3: Login with non-existent user
  const nonExistResult = await fetchAPI('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ employeeCode: '99999', password: '123456' })
  });
  recordTest('Login with non-existent user (should fail)', !nonExistResult.ok);

  // Test 1.4: Get profile with valid token
  if (tokens.user) {
    const profileResult = await fetchAPI('/auth/profile', {
      headers: { Authorization: `Bearer ${tokens.user}` }
    });
    recordTest('Get profile with valid token', profileResult.ok && profileResult.data?.data?.employeeCode);
  }

  // Test 1.5: Get profile without token
  const noTokenResult = await fetchAPI('/auth/profile');
  recordTest('Get profile without token (should fail)', !noTokenResult.ok);
}

// ============================================
// 2. Leave Types & Balance Tests
// ============================================
async function testLeaveTypesAndBalance() {
  console.log('\n' + colors.blue + '=== 2. ทดสอบประเภทการลาและวันลาคงเหลือ ===' + colors.reset);

  // Test 2.1: Get leave types
  const typesResult = await fetchAPI('/leaves/types', {
    headers: { Authorization: `Bearer ${tokens.user}` }
  });
  recordTest('Get leave types', typesResult.ok && Array.isArray(typesResult.data?.data));

  // Test 2.2: Get leave balance
  const balanceResult = await fetchAPI('/leaves/balance', {
    headers: { Authorization: `Bearer ${tokens.user}` }
  });
  recordTest('Get leave balance', balanceResult.ok && typesResult.data?.data);
}

// ============================================
// 3. Leave Request Tests
// ============================================
async function testLeaveRequests() {
  console.log('\n' + colors.blue + '=== 3. ทดสอบคำขอลา ===' + colors.reset);

  // Test 3.1: Get my leaves
  const leavesResult = await fetchAPI('/leaves', {
    headers: { Authorization: `Bearer ${tokens.user}` }
  });
  recordTest('Get my leaves', leavesResult.ok);

  // Test 3.2: Get single leave detail (if any exists)
  if (leavesResult.ok && leavesResult.data?.data?.leaves?.length > 0) {
    const leaveId = leavesResult.data.data.leaves[0].id;
    const detailResult = await fetchAPI(`/leaves/${leaveId}`, {
      headers: { Authorization: `Bearer ${tokens.user}` }
    });
    recordTest('Get leave detail', detailResult.ok);
  } else {
    log('warning', 'No leaves found to test detail endpoint');
  }
}

// ============================================
// 4. Director Approval Tests
// ============================================
async function testDirectorApproval() {
  console.log('\n' + colors.blue + '=== 4. ทดสอบ Director API ===' + colors.reset);

  if (!tokens.director) {
    log('warning', 'No director token, skipping director tests');
    return;
  }

  // Test 4.1: Get pending leaves for director
  const pendingResult = await fetchAPI('/director/leaves/pending', {
    headers: { Authorization: `Bearer ${tokens.director}` }
  });
  recordTest('Director: Get pending leaves', pendingResult.ok);
}

// ============================================
// 5. Central Office Tests
// ============================================
async function testCentralOffice() {
  console.log('\n' + colors.blue + '=== 5. ทดสอบ Central Office API ===' + colors.reset);

  // Test 5.1: Central Staff - Get approved level 1 leaves
  if (tokens.centralStaff) {
    const staffResult = await fetchAPI('/central-office/staff/pending', {
      headers: { Authorization: `Bearer ${tokens.centralStaff}` }
    });
    recordTest('Central Staff: Get pending leaves', staffResult.ok);
  }

  // Test 5.2: Central Head - Get approved level 2 leaves
  if (tokens.centralHead) {
    const headResult = await fetchAPI('/central-office/head/pending', {
      headers: { Authorization: `Bearer ${tokens.centralHead}` }
    });
    recordTest('Central Head: Get pending leaves', headResult.ok);
  }
}

// ============================================
// 6. Admin Tests
// ============================================
async function testAdmin() {
  console.log('\n' + colors.blue + '=== 6. ทดสอบ Admin API ===' + colors.reset);

  if (!tokens.admin) {
    log('warning', 'No admin token, skipping admin tests');
    return;
  }

  // Test 6.1: Get pending leaves for admin
  const pendingResult = await fetchAPI('/admin/leaves/pending', {
    headers: { Authorization: `Bearer ${tokens.admin}` }
  });
  recordTest('Admin: Get pending leaves', pendingResult.ok);
}

// ============================================
// 7. Notification Tests
// ============================================
async function testNotifications() {
  console.log('\n' + colors.blue + '=== 7. ทดสอบ Notifications ===' + colors.reset);

  // Test 7.1: Get notifications
  const notifResult = await fetchAPI('/notifications', {
    headers: { Authorization: `Bearer ${tokens.user}` }
  });
  recordTest('Get notifications', notifResult.ok);

  // Test 7.2: Get unread count
  const countResult = await fetchAPI('/notifications/unread-count', {
    headers: { Authorization: `Bearer ${tokens.user}` }
  });
  recordTest('Get unread count', countResult.ok);
}

// ============================================
// 8. Role-based Access Control Tests
// ============================================
async function testRBAC() {
  console.log('\n' + colors.blue + '=== 8. ทดสอบ Role-based Access Control ===' + colors.reset);

  // Test 8.1: User cannot access director endpoints
  const userTryDirector = await fetchAPI('/director/leaves/pending', {
    headers: { Authorization: `Bearer ${tokens.user}` }
  });
  recordTest('User cannot access director endpoints', !userTryDirector.ok);

  // Test 8.2: User cannot access admin endpoints
  const userTryAdmin = await fetchAPI('/admin/leaves/pending', {
    headers: { Authorization: `Bearer ${tokens.user}` }
  });
  recordTest('User cannot access admin endpoints', !userTryAdmin.ok);

  // Test 8.3: Director cannot access admin endpoints
  if (tokens.director) {
    const directorTryAdmin = await fetchAPI('/admin/leaves/pending', {
      headers: { Authorization: `Bearer ${tokens.director}` }
    });
    recordTest('Director cannot access admin endpoints', !directorTryAdmin.ok);
  }
}

// ============================================
// Run All Tests
// ============================================
async function runAllTests() {
  console.log(colors.yellow + '\n╔════════════════════════════════════════════════════╗');
  console.log('║     ระบบทดสอบ API - ระบบการลาออนไลน์               ║');
  console.log('╚════════════════════════════════════════════════════╝' + colors.reset);
  
  const startTime = Date.now();

  try {
    await testAuthentication();
    await testLeaveTypesAndBalance();
    await testLeaveRequests();
    await testDirectorApproval();
    await testCentralOffice();
    await testAdmin();
    await testNotifications();
    await testRBAC();
  } catch (error) {
    log('error', `Test execution error: ${error.message}`);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // Print summary
  console.log('\n' + colors.yellow + '════════════════════════════════════════════════════' + colors.reset);
  console.log(colors.blue + '📊 สรุปผลการทดสอบ' + colors.reset);
  console.log(colors.yellow + '════════════════════════════════════════════════════' + colors.reset);
  console.log(`✓ ผ่าน: ${colors.green}${testResults.passed}${colors.reset}`);
  console.log(`✗ ไม่ผ่าน: ${colors.red}${testResults.failed}${colors.reset}`);
  console.log(`⏱ เวลาทดสอบ: ${duration} วินาที`);
  
  if (testResults.failed === 0) {
    console.log('\n' + colors.green + '🎉 ทดสอบผ่านทั้งหมด! ระบบพร้อมใช้งาน' + colors.reset);
  } else {
    console.log('\n' + colors.red + '⚠️ มีบางรายการไม่ผ่าน กรุณาตรวจสอบ:' + colors.reset);
    testResults.tests.filter(t => !t.passed).forEach(t => {
      console.log(`  - ${t.name}: ${t.message}`);
    });
  }
}

// Run
runAllTests();
